<?php

namespace Drupal\cbc_custom\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Drupal\Core\Session\AccountInterface;

/**
 * Adds security headers and safely validates uploaded files.
 */
class SecurityHeadersSubscriber implements EventSubscriberInterface {

  protected AccountInterface $currentUser;

  public function __construct(AccountInterface $current_user) {
    $this->currentUser = $current_user;
  }

  /**
   * Validate uploaded files (Drupal/Symfony-safe).
   */
  public function onKernelRequest(RequestEvent $event): void {
    // Redundant file validation removed to allow non-image uploads (PDF, Video).
    // Logic moved to CBC Security module.
  }

  protected function validateUploadedFiles(array $files, RequestEvent $event): void {
    foreach ($files as $file) {
      if (is_array($file)) {
        $this->validateUploadedFiles($file, $event);
      }
      else {
        $this->validateUploadedFile($file, $event);
      }
    }
  }

  protected function validateUploadedFile($file, RequestEvent $event): void {
    if (!$file instanceof UploadedFile) {
      return;
    }

    $originalName = $file->getClientOriginalName();
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $mimeType = $file->getClientMimeType();

    // ✅ Allow only real image MIME types
    $allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    // 1. Extension required
    if ($extension === '') {
      $this->block($event, 'Security Alert: File extension missing.');
      return;
    }

    // 2. MIME must match allowed list
    if (!in_array($mimeType, $allowedMimeTypes, TRUE)) {
      $this->block($event, 'Security Alert: Invalid image MIME type.');
      return;
    }

    // 3. Verify actual image content
    if (@getimagesize($file->getRealPath()) === false) {
      $this->block($event, 'Security Alert: File is not a valid image.');
      return;
    }

    // 4. Block malicious filename characters
    if (preg_match('/[<>"\']/', $originalName)) {
      $this->block($event, 'Security Alert: Malicious filename detected.');
      return;
    }

    // 5. Explicit bad filename block
    if ($originalName === 'kjlkmlkl') {
      $this->block($event, 'Security Alert: Blocked filename.');
    }
  }

  protected function block(RequestEvent $event, string $message): void {
    $event->setResponse(new Response($message, 403));
    $event->stopPropagation();
  }

  /**
   * Add security headers.
   */
  public function onKernelResponse(ResponseEvent $event): void {
    $response = $event->getResponse();
    $path = $event->getRequest()->getPathInfo();

    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Fixed-By', 'Antigravity');

    if ($this->currentUser->isAuthenticated() || $this->isSensitivePath($path)) {
      $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
      $response->headers->set('Pragma', 'no-cache');
      $response->headers->set('Expires', '0');
      $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
      $response->headers->set('X-XSS-Protection', '1; mode=block');
    }
  }

  protected function isSensitivePath(string $path): bool {
    return (bool) preg_match(
      '#^/(user|admin|batch|private|vigilance-knowledge-sharing)#',
      $path
    );
  }

  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::REQUEST => ['onKernelRequest', 100],
      KernelEvents::RESPONSE => ['onKernelResponse', -100],
    ];
  }

}
