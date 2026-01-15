<?php

namespace Drupal\cbc_custom\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Drupal\Core\Session\AccountInterface;

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
   * Responds to the KernelEvents::RESPONSE event.
   *
   * @param \Symfony\Component\HttpKernel\Event\ResponseEvent $event
   *   The response event.
   */
  public function onKernelResponse(ResponseEvent $event) {
    if (!$event->isMainRequest()) {
      return;
    }

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
      KernelEvents::RESPONSE => ['onKernelResponse', -100],
    ];
  }

}
