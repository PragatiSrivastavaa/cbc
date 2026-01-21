<?php
use Drupal\Core\DrupalKernel;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require_once 'autoload.php';
$request = Request::createFromGlobals();
$kernel = DrupalKernel::createFromRequest($request, $autoloader, 'prod');
$kernel->boot();

// Get the container and clear all caches
$container = $kernel->getContainer();
\Drupal::setContainer($container);

foreach (\Drupal::service('cache.static')->getBins() as $bin) {
  \Drupal::service('cache.' . $bin)->deleteAll();
}

// Rebuild the router and other things
\Drupal::service('kernel')->invalidateContainer();
\Drupal::service('router.builder')->rebuild();

echo "Drupal cache cleared via container.\n";
