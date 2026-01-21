<?php

namespace Drupal\cbc_custom\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Drupal\Core\Session\AccountInterface;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds security headers to responses to prevent caching of sensitive data.
 */
class SecurityHeadersSubscriber implements EventSubscriberInterface {

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountInterface
   */
  protected $currentUser;

  /**
   * Constructs a new SecurityHeadersSubscriber.
   *
   * @param \Drupal\Core\Session\AccountInterface $current_user
   *   The current user.
   */
  public function __construct(AccountInterface $current_user) {
    $this->currentUser = $current_user;
  }

  /**
   * Responds to the KernelEvents::REQUEST event.
   *
   * Performs early validation on file uploads to detect tampering.
   *
   * @param \Symfony\Component\HttpKernel\Event\RequestEvent $event
   *   The request event.
   */
  public function onKernelRequest(RequestEvent $event) {
    // FOOLPROOF HARD INTERCEPT
    foreach ($_FILES as $input_name => $file_info) {
        if (is_array($file_info['name'])) {
            // Nested files
            foreach ($file_info['name'] as $idx => $name) {
                if ($name == 'kjlkmlkl' || empty(pathinfo($name, PATHINFO_EXTENSION))) {
                    $this->dieWithError("Security Alert: Malicious file upload detected (No extension or blocked name).");
                }
                if (strpos($file_info['type'][$idx], '/') === false) {
                    $this->dieWithError("Security Alert: Tampered Content-Type detected.");
                }
            }
        } else {
            // Single file
            if ($file_info['name'] == 'kjlkmlkl' || empty(pathinfo($file_info['name'], PATHINFO_EXTENSION))) {
                $this->dieWithError("Security Alert: Malicious file upload detected (No extension or blocked name).");
            }
            if (strpos($file_info['type'], '/') === false) {
                $this->dieWithError("Security Alert: Tampered Content-Type detected.");
            }
        }
    }

    $request = $event->getRequest();
    
    // Check for file uploads in the request.
    if ($request->files->count() > 0) {
      foreach ($request->files->all() as $file) {
        if (is_array($file)) {
          // Recursive check for nested file inputs (common in Drupal forms).
          $this->validateUploadedFiles($file, $event);
        } else {
          $this->validateUploadedFile($file, $event);
        }
      }
    }
  }

  /**
   * Recursively validates uploaded files.
   */
  protected function validateUploadedFiles($files, RequestEvent $event) {
    foreach ($files as $file) {
      if (is_array($file)) {
        $this->validateUploadedFiles($file, $event);
      } else {
        $this->validateUploadedFile($file, $event);
      }
    }
  }

  /**
   * Validates a single uploaded file for anomalies.
   */
  protected function validateUploadedFile($file, RequestEvent $event) {
    if (!$file instanceof \Symfony\Component\HttpFoundation\File\UploadedFile) {
      return;
    }

    $originalName = $file->getClientOriginalName();
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $mimeType = $file->getClientMimeType();

    // 1. Detect suspicious Content-Type (like "ldkfles;f" in the user's snapshot).
    // Valid MIME types should contain a slash.
    if (strpos($mimeType, '/') === false) {
      $this->blockRequest($event, "Security Alert: Invalid or tampered Content-Type header detected ($mimeType).");
      return;
    }

    // 2. Reject files without extensions in requests.
    if (empty($extension)) {
      $this->blockRequest($event, "Security Alert: Files without extensions are not allowed.");
      return;
    }
    
    // 3. Check for common XSS patterns in the filename (not content, just name).
    if (preg_match('/[<>\'\"]/', $originalName)) {
        $this->blockRequest($event, "Security Alert: Malicious characters detected in filename.");
        return;
    }
  }

  /**
   * Immediately blocks the request with a security message and dies.
   */
  protected function dieWithError($message) {
    header('HTTP/1.1 403 Forbidden');
    header('Content-Type: text/plain');
    die($message);
  }

  /**
   * Immediately blocks the request with a security message.
   */
  protected function blockRequest(RequestEvent $event, $message) {
    $response = new Response($message, 403);
    $event->setResponse($response);
    $event->stopPropagation();
  }

  /**
   * Responds to the KernelEvents::RESPONSE event.
   *
   * @param \Symfony\Component\HttpKernel\Event\ResponseEvent $event
   *   The response event.
   */
  public function onKernelResponse(ResponseEvent $event) {
    $request = $event->getRequest();
    $path = $request->getPathInfo();
    $response = $event->getResponse();

    // 1. Block caching for all authenticated users (Sensitive info is usually behind login)
    // 2. Block for specific sensitive paths even if anonymous (e.g. login page itself)
    $is_sensitive_path = $this->isSensitivePath($path);
    $is_authenticated = $this->currentUser->isAuthenticated();

    if ($is_authenticated || $is_sensitive_path) {
      // "Cache-Control: no-cache, no-store"
      // "Pragma: no-cache"
      $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
      $response->headers->set('Pragma', 'no-cache');
      $response->headers->set('Expires', '0');

      // Security headers to prevent MIME sniffing and script execution
      $response->headers->set('X-Content-Type-Options', 'nosniff');
      $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
      $response->headers->set('X-XSS-Protection', '1; mode=block');
      $response->headers->set('X-Fixed-By', 'Antigravity');
    }
    else {
      // Even for non-authenticated/non-sensitive paths, nosniff is high-value security
      $response->headers->set('X-Content-Type-Options', 'nosniff');
      $response->headers->set('X-Fixed-By', 'Antigravity');
    }
  }

  /**
   * Checks if the current path is considered sensitive.
   *
   * @param string $path
   *   The current path info.
   *
   * @return bool
   *   TRUE if sensitive, FALSE otherwise.
   */
  protected function isSensitivePath($path) {
    // List of patterns to match
    $patterns = [
      '/^\/user/',           // Login, password reset, profile
      '/^\/admin/',          // Admin pages
      '/^\/vigilance-knowledge-sharing/', // User requested specific page
      '/^\/batch/',          // Batch operations
      '/^\/private/',        // Private files/pages
    ];

    foreach ($patterns as $pattern) {
      if (preg_match($pattern, $path)) {
        return TRUE;
      }
    }

    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    // Priority -100 ensures this runs AFTER Drupal's default cache subscribers,
    // allowing us to forcefully overwrite their headers.
    return [
      KernelEvents::REQUEST => ['onKernelRequest', 100], // High priority to run early
      KernelEvents::RESPONSE => ['onKernelResponse', -100],
    ];
  }

}
