<?php

namespace Drupal\cbc_security\Plugin\Validation\Constraint;

use Symfony\Component\Validator\Constraint;

/**
 * Checks if the file is valid and secure.
 *
 * @Constraint(
 *   id = "cbc_security_file_validate",
 *   label = @Translation("CBC Security File Validate", context = "Validation"),
 *   type = "file"
 * )
 */
class CbcSecurityFileValidate extends Constraint {
  public $message = 'Security Alert: The file "%filename" is not allowed.';
  public $mimeTypeMessage = 'Security Alert: The file type (%mime) is not allowed for .%ext files.';
  public $tamperMessage = 'Security Alert: Request tampering detected. Content-Type header (%header) does not match actual content (%content).';
  public $extensionMessage = 'Security Alert: File extension (.%ext) does not match detected content type (%mime).';
  public $maliciousMessage = 'Security Alert: Potentially malicious content (script/HTML) detected in file.';
  public $noExtensionMessage = 'Security Alert: Files without extensions are not allowed.';
}
