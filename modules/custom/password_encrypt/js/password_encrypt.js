(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.password_encrypt = {
    attach: function (context, settings) {

      // Safety check for settings
      if (!drupalSettings.password_encrypt || !drupalSettings.password_encrypt.passkey) {
        return;
      }

      var passkey = drupalSettings.password_encrypt.passkey;

      // Safety check for library
      if (typeof CryptoJS === 'undefined') {
        console.error('Password Encrypt: CryptoJS is not defined.');
        return;
      }

      // Helper function to encrypt
      var encrypt = function (value) {
        if (!value) return '';
        try {
          return CryptoJS.AES.encrypt(value, passkey).toString();
        } catch (e) {
          console.error('Encryption error:', e);
          return value; // Fallback to plain text on error
        }
      };

      // Helper to check if already encrypted (Salted__ header in Base64 is U2FsdGVkX1)
      var isEncrypted = function (value) {
        if (!value || value.length < 10) return false;
        return value.substring(0, 10) === 'U2FsdGVkX1';
      };

      // 1. Handle Login Forms
      var $loginForms = $(context).find('form#user-login-form, form.user-login-form, form[id^="user-login-form"]');

      $loginForms.each(function () {
        var $form = $(this);
        if ($form.data('password-encrypt-attached')) return;
        $form.data('password-encrypt-attached', true);

        $form.submit(function (event) {
          // Check validity
          if (this.checkValidity && !this.checkValidity()) {
            return;
          }

          // Double submit protection
          if ($form.data('is_submitting')) {
            event.preventDefault();
            return false;
          }
          $form.data('is_submitting', true);

          // Find field
          var $input = $form.find('input[name="pass"]');
          var pass = $input.val();

          if (pass && !isEncrypted(pass)) {
            console.log('Encrypting login password...');
            var cipher = encrypt(pass);
            $input.val(cipher);
          }
        });
      });

      // 2. Handle Register and Edit User Forms
      var $userForms = $(context).find('form#user-register-form, form#user-form, form.user-register-form, form.user-form');

      $userForms.each(function () {
        var $form = $(this);
        if ($form.data('password-encrypt-attached')) return;
        $form.data('password-encrypt-attached', true);

        $form.submit(function (event) {
          var $currentPass = $form.find('input[name="current_pass"]');
          var $pass1 = $form.find('input[name="pass[pass1]"]');
          var $pass2 = $form.find('input[name="pass[pass2]"]');

          var currentVal = $currentPass.val();
          var p1Val = $pass1.val();
          var p2Val = $pass2.val();

          // Simple mismatch check
          if (p1Val && p2Val && p1Val !== p2Val) {
            // If mismatch, we let browser/drupal show error (or custom)
            // But we verify here just to be safe to not lock the form
            if ($form.find('.password-encrypt-error').length === 0) {
              $pass2.after('<span class="password-encrypt-error error" style="color:red; display:block; margin-top:5px;">Passwords confirm field does not match.</span>');
            }
            $pass2.focus();
            event.preventDefault();
            return false;
          } else {
            $form.find('.password-encrypt-error').remove();
          }

          // Check validity
          if (this.checkValidity && !this.checkValidity()) {
            return;
          }

          // Double submit protection
          if ($form.data('is_submitting')) {
            event.preventDefault();
            return false;
          }
          $form.data('is_submitting', true);

          // Encrypt Current Password
          if (currentVal && !isEncrypted(currentVal)) {
            console.log('Encrypting current password...');
            $currentPass.val(encrypt(currentVal));
          }

          // Encrypt New Password
          if (p1Val) {
            var passCipher;
            if (!isEncrypted(p1Val)) {
              console.log('Encrypting new password...');
              passCipher = encrypt(p1Val);
              $pass1.val(passCipher);
            } else {
              passCipher = p1Val; // Already encrypted
            }

            // Sync confirm field
            if (p2Val === p1Val) {
              $pass2.val(passCipher);
            }
          }
        });
      });
    }
  };

})(jQuery, Drupal, drupalSettings);
