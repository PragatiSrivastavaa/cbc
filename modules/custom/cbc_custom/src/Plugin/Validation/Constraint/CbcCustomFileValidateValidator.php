<?php

namespace Drupal\cbc_custom\Plugin\Validation\Constraint;

use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\FileInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

/**
 * Validates the CbcCustomFileValidate constraint.
 */
class CbcCustomFileValidateValidator extends ConstraintValidator implements ContainerInjectionInterface {

  /**
   * The file system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * Constructs a new CbcCustomFileValidateValidator.
   *
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   */
  public function __construct(FileSystemInterface $file_system) {
    $this->fileSystem = $file_system;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('file_system')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function validate($value, Constraint $constraint) {
    /** @var \Drupal\file\FileInterface $file */
    $file = $value;

    // Handle both FileInterface objects and potentially field items.
    if ($file instanceof \Drupal\file\Plugin\Field\FieldType\FileItem) {
      $file = $file->entity;
    }

    if (!$file instanceof FileInterface) {
      return;
    }

    $file_path = $file->getFileUri();
    $real_path = $this->fileSystem->realpath($file_path);
    
    if (!$real_path || !file_exists($real_path)) {
      return;
    }

    // LOGGING FOR VERIFICATION (Keep the legacy logging)
    $log_path = $this->fileSystem->realpath('public://') . '/cbc_validation_log.txt';
    file_put_contents($log_path, date('Y-m-d H:i:s') . ' - Validating via Constraint: ' . $file->getFilename() . ' (' . $file->getMimeType() . ")\n", FILE_APPEND);

    $filename = $file->getFilename();
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    // 1. Detect actual MIME type using binary content analysis.
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $actual_mime_type = $finfo->file($real_path);

    // 2. Strict whitelist of allowed MIME types and their corresponding extensions.
    $allowed_map = [
      'image/png' => ['png'],
      'image/x-png' => ['png'],
      'image/gif' => ['gif'],
      'image/jpeg' => ['jpg', 'jpeg'],
      'image/pjpeg' => ['jpg', 'jpeg'],
      'image/webp' => ['webp'],
      'application/pdf' => ['pdf'],
      'application/msword' => ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx'],
      'application/vnd.ms-excel' => ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['xlsx'],
      'text/plain' => ['txt'],
    ];

    // 3. Reject files with no extension to prevent MIME-sniffing exploits.
    if (empty($extension)) {
      $this->context->addViolation($constraint->noExtensionMessage);
      return;
    }

    // 4. Check if the detected MIME type is in our whitelist.
    if (!isset($allowed_map[$actual_mime_type])) {
      $this->context->addViolation($constraint->mimeTypeMessage, ['%mime' => $actual_mime_type]);
      return;
    }

    // 5. Detect tampering: Ensure the MIME type provided in the request matches content.
    $request_mime_type = $file->getMimeType();
    if ($request_mime_type != $actual_mime_type && !($request_mime_type == 'image/png' && $actual_mime_type == 'image/x-png')) {
       $this->context->addViolation($constraint->tamperMessage, [
         '%header' => $request_mime_type,
         '%content' => $actual_mime_type,
       ]);
    }

    // 6. Ensure the extension matches the detected MIME type.
    if (!in_array($extension, $allowed_map[$actual_mime_type])) {
      $this->context->addViolation($constraint->extensionMessage, [
        '%ext' => $extension,
        '%mime' => $actual_mime_type,
      ]);
    }

    // 7. Scan file content for malicious strings/tags (XSS prevention).
    $content = file_get_contents($real_path);
    $malicious_patterns = [
      '/<script/i', '/javascript:/i', '/onerror/i', '/onload/i', '/onclick/i',
      '/onmouseover/i', '/alert\(/i', '/eval\(/i', '/<iframe/i', '/<object/i',
      '/<embed/i', '/<form/i', '/<html/i', '/<body/i', '/<head/i', '/SVG/i', '/xmlns/i'
    ];

    foreach ($malicious_patterns as $pattern) {
      if (preg_match($pattern, $content)) {
        $this->context->addViolation($constraint->maliciousMessage);
        break;
      }
    }
  }
}
