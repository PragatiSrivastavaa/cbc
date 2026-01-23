<?php

namespace Drupal\cbc_security\Plugin\Validation\Constraint;

use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\FileInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

/**
 * Validates the CbcSecurityFileValidate constraint.
 */
class CbcSecurityFileValidateValidator extends ConstraintValidator implements ContainerInjectionInterface {

  protected $fileSystem;

  public function __construct(FileSystemInterface $file_system) {
    $this->fileSystem = $file_system;
  }

  public static function create(ContainerInterface $container) {
    return new static($container->get('file_system'));
  }

  public function validate($value, Constraint $constraint) {
    /** @var \Drupal\file\FileInterface $file */
    $file = $value;
    if (!$file instanceof FileInterface) {
      return;
    }
    
    $filename = $file->getFilename();
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mime = $file->getMimeType();
    
    $log_path = \Drupal::service('file_system')->realpath('public://') . '/cbc_security_debug.log';
    file_put_contents($log_path, date('Y-m-d H:i:s') . " - Constraint Validating: $filename, Ext: $extension, MIME: $mime\n", FILE_APPEND);

    // Allowed Map
    $allowed_map = [
      'image/jpeg' => ['jpg', 'jpeg'],
      'image/png' => ['png'],
      'image/gif' => ['gif'],
      'image/webp' => ['webp'],
      'image/avif' => ['avif'],
      'application/pdf' => ['pdf'],
      'application/x-pdf' => ['pdf'],
      'video/mp4' => ['mp4', 'm4v'],
      'video/mpeg' => ['mpg', 'mpeg'],
      'video/quicktime' => ['mov'],
      'video/x-msvideo' => ['avi'],
      'audio/mpeg' => ['mp3'],
      'audio/wav' => ['wav'],
      'audio/x-wav' => ['wav'],
      'audio/ogg' => ['ogg'],
      'audio/mp4' => ['m4a', 'mp4'],
      'application/msword' => ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx'],
      'application/vnd.ms-excel' => ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['xlsx'],
      'application/zip' => ['docx', 'xlsx', 'pptx', 'zip'],
      'text/plain' => ['txt', 'csv'],
      'application/octet-stream' => ['pdf', 'mp4', 'avi', 'mov', 'mpg', 'mpeg', 'wav', 'mp3', 'm4a', 'docx', 'xlsx'],
    ];

    // Permissive check for common media/doc extensions
    $safe_extensions = ['pdf', 'mp4', 'mov', 'avi', 'mpg', 'mpeg', 'wav', 'mp3', 'm4a', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'avif'];
    
    if (in_array($extension, $safe_extensions)) {
        file_put_contents($log_path, date('Y-m-d H:i:s') . " - $filename allowed (Safe Extension - Constraint)\n", FILE_APPEND);
        return;
    }

    if (!isset($allowed_map[$mime]) || !in_array($extension, $allowed_map[$mime])) {
        // Last resort: if it's not in the map, block it unless it's an image we can verify
        if (strpos($mime, 'image/') === 0) {
            $realpath = $this->fileSystem->realpath($file->getFileUri());
            if ($realpath && @getimagesize($realpath)) {
                return;
            }
        }
        
        $this->context->buildViolation($constraint->message)
          ->setParameter('%filename', $filename)
          ->setParameter('%type', $mime)
          ->addViolation();
          
        file_put_contents($log_path, date('Y-m-d H:i:s') . " - $filename BLOCKED (Constraint): $mime / $extension\n", FILE_APPEND);
    }
  }
}
