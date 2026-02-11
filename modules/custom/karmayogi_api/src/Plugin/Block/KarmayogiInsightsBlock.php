<?php

namespace Drupal\karmayogi_api\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use GuzzleHttp\ClientInterface;

/**
 * Provides a 'Karmayogi Insights' Block.
 *
 * @Block(
 *   id = "karmayogi_insights_block",
 *   admin_label = @Translation("Karmayogi Insights Block")
 * )
 */
class KarmayogiInsightsBlock extends BlockBase implements ContainerFactoryPluginInterface {

  protected $httpClient;

  public function __construct(array $configuration, $plugin_id, $plugin_definition, ClientInterface $http_client) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->httpClient = $http_client;
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('http_client')
    );
  }

  public function build() {

    $apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJEYzNRdWk0R1VYb1h1Q3VNaTRkU29MQVhBQXlxYml4cCJ9.H1A8CQ6Dyz-8_Lg_9AzCTXn_MDZuGg2OxjB_ELv956c';
    $url = 'https://uat.karmayogibharat.net/api/v1/landingpage/insights';

    try {
      $response = $this->httpClient->get($url, [
        'headers' => [
          'Authorization' => 'Bearer ' . $apiKey,
        ],
      ]);

      $data = json_decode($response->getBody(), TRUE);
	  //print_r($data);
      $stats = $data['result']['data'] ?? [];

      return [
        '#theme' => 'karmayogi_insights',
        '#data' => [
          'users' => $stats['Total Karmayogis Onboarded'] ?? 0,
          'courses' => $stats['Total Courses'] ?? 0,
          'completions' => $stats['Total Completions'] ?? 0,
          'active' => $stats['Monthly Active Users'] ?? 0,
          'certificates' => $stats['Certificate Issued Yesterday'] ?? 0,
        ],
        '#cache' => [
          'max-age' => 3600, // cache for 1 hour
        ],
      ];

    } catch (\Exception $e) {

      return [
        '#markup' => 'API Error: ' . $e->getMessage(),
        '#cache' => ['max-age' => 0],
      ];
    }
  }
}
