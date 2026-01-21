(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.password_encrypt = {
    attach: function (context, settings) {

      // Helper to encrypt with AES and output as HEX (looks like a hash)
      var encrypt = function (value, key) {
        if (!value) return '';
        if (!key) return value;
        try {
          var encrypted = CryptoJS.AES.encrypt(value, key);
          var base64 = encrypted.toString();
          var raw = CryptoJS.enc.Base64.parse(base64);
          return CryptoJS.enc.Hex.stringify(raw);
        } catch (e) {
          console.error('Encryption error:', e);
          return value;
        }
      };

      // Helper to check if already encrypted
      var isEncrypted = function (value) {
        if (!value || value.length < 32) return false;
        // Hex for 'Salted__' is '53616c7465645f5f'
        return value.substring(0, 16) === '53616c7465645f5f';
      };

      if (typeof CryptoJS === 'undefined' || typeof CryptoJS.AES === 'undefined') {
        return;
      }

      var $forms = $(context).find('form#user-login-form, form#user-register-form, form#user-form, form.user-register-form, form.user-form');

      $forms.each(function () {
        var $form = $(this);
        var token = $form.attr('data-pe-t');
        if (!token) return;

        if ($form.data('password-encrypt-attached')) return;
        $form.data('password-encrypt-attached', true);

        $form.submit(function (event) {
          if ($form.data('is_submitting')) return true;

          var $pass1 = $form.find('input[name="pass[pass1]"], input[name="pass"]');
          var $pass2 = $form.find('input[name="pass[pass2]"]');
          var $currentPass = $form.find('input[name="current_pass"]');

          var p1Val = $pass1.val();
          var p2Val = $pass2.val();
          var currVal = $currentPass.val();

          // Standard mismatch check for UX
          if ($pass2.length && p1Val && p2Val && p1Val !== p2Val) {
            return true; // Let Drupal handle mismatch validation
          }

          // Encrypt New Password
          if (p1Val && !isEncrypted(p1Val)) {
            var cipher = encrypt(p1Val, token);
            $pass1.val(cipher);
            if ($pass2.length) $pass2.val(cipher);
          }

          // Encrypt Current Password
          if (currVal && !isEncrypted(currVal)) {
            $currentPass.val(encrypt(currVal, token));
          }

          $form.data('is_submitting', true);
        });
      });
    }
  };

})(jQuery, Drupal, drupalSettings);
