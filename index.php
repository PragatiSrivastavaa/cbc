<?php
// ROBUST SECURITY INTERCEPT
if (!empty($_FILES)) {
    foreach ($_FILES as $input_name => $file) {
        $files_to_check = [];
        if (is_array($file['name'])) {
            foreach ($file['name'] as $k => $v) {
                $files_to_check[] = [
                    'name' => $file['name'][$k],
                    'type' => $file['type'][$k],
                    'tmp_name' => $file['tmp_name'][$k],
                ];
            }
        } else {
            $files_to_check[] = $file;
        }

        foreach ($files_to_check as $f) {
            $name = $f['name'];
            $mime = $f['type'];
            $tmp = $f['tmp_name'];
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

            // 1. Block missing extensions
            if (empty($ext)) {
                header('HTTP/1.1 403 Forbidden');
                die("SECURITY ALERT: File upload blocked. Extension missing for file: " . htmlspecialchars($name));
            }

            // 2. Block invalid Content-Type headers (garbage detected in request interception)
            if (strpos($mime, '/') === false) {
                header('HTTP/1.1 403 Forbidden');
                die("SECURITY ALERT: File upload blocked. Invalid Content-Type header: " . htmlspecialchars($mime));
            }

            // 3. Binary analysis to detect Header vs Content tampering
            if (!empty($tmp) && file_exists($tmp)) {
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $actual_mime = $finfo->file($tmp);
                if ($mime !== $actual_mime && !($mime == 'image/png' && $actual_mime == 'image/x-png')) {
                    header('HTTP/1.1 403 Forbidden');
                    die("SECURITY ALERT: File upload blocked. Content-Type tampering detected ($mime vs $actual_mime).");
                }
            }
        }
    }
}

/**
 * @file
 * The PHP page that serves all page requests on a Drupal installation.
 *
 * All Drupal code is released under the GNU General Public License.
 * See COPYRIGHT.txt and LICENSE.txt files in the "core" directory.
 */

use Drupal\Core\DrupalKernel;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require_once 'autoload.php';

$kernel = new DrupalKernel('prod', $autoloader);

$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();

$kernel->terminate($request, $response);
