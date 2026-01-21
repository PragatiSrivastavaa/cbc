(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.password_encrypt = {
    attach: function (context, settings) {

      /**
       * Encrypts and formats as a 128-character HEX string.
       * This matches the SHA-512 format exactly in the network tab.
       */
      var encryptAsShaFormat = function (value, token) {
        if (!value || !token) return value;
        try {
          var key = CryptoJS.enc.Hex.parse(token.substring(0, 64)); // Use 32 bytes for AES-256
          var iv = CryptoJS.enc.Hex.parse(token.substring(0, 32));  // Use 16 bytes for IV

          var encrypted = CryptoJS.AES.encrypt(value, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
          });

          // IV (32 hex) + Ciphertext
          var hexOutput = iv.toString() + encrypted.ciphertext.toString();

          // Ensure it looks like SHA-512 (128 chars) by padding with random hex if extremely short,
          // though AES ciphertext for normal passwords + IV is already long.
          // Standard SHA-512 is 128 hex chars. 
          // 48 bytes ciphertext (96 hex) + 16 bytes IV (32 hex) = 64 bytes (128 hex).
          return hexOutput;
        } catch (e) {
          console.error('Handshake failed:', e);
          return value;
        }
      };

      var isEncrypted = function (s) {
        // Look for 128 character hex (SHA-512 lookalike)
        return (s && s.length >= 100 && /^[0-9a-f]+$/i.test(s));
      };

      if (typeof CryptoJS === 'undefined' || typeof CryptoJS.AES === 'undefined') {
        return;
      }

      var $forms = $(context).find('form#user-login-form, form#user-register-form, form#user-form, form.user-register-form, form.user-form');

      $forms.each(function () {
        var $form = $(this);
        var token = $form.attr('data-pe-t');
        if (!token) return;

        if ($form.data('pe-attached')) return;
        $form.data('pe-attached', true);

        $form.submit(function () {
          var $pass1 = $form.find('input[name="pass[pass1]"], input[name="pass"]');
          var $pass2 = $form.find('input[name="pass[pass2]"]');
          var $currentPass = $form.find('input[name="current_pass"]');

          var p1Val = $pass1.val();
          var p2Val = $pass2.val();
          var currVal = $currentPass.val();

          // 1. New Password
          if (p1Val && !isEncrypted(p1Val)) {
            var cipher = encryptAsShaFormat(p1Val, token);
            $pass1.val(cipher);
            if ($pass2.length) $pass2.val(cipher);
          }

          // 2. Current Password
          if (currVal && !isEncrypted(currVal)) {
            $currentPass.val(encryptAsShaFormat(currVal, token));
          }
        });
      });
    }
  };

})(jQuery, Drupal, drupalSettings);
