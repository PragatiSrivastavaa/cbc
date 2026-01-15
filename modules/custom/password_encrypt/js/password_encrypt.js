(function ($, Drupal, drupalSettings) {
  'use strict';
  // This function is strict.
  Drupal.behaviors.password_encrypt = {
    attach: function (context, settings) {
      var passkey = drupalSettings.password_encrypt.passkey;
      var cipher;
      var pass;
      var cpass;
      var current_pass;

      $('form.user-login, form.user-login-form', context).submit(function (event) {
        pass = $('#edit-pass').val();
        if (pass !== '') {
          console.log('Encrypting login password with key:', passkey);
          cipher = CryptoJS.AES.encrypt(pass, passkey).toString();
          console.log('Ciphertext generated:', cipher.substring(0, 20) + '...');
          $('#edit-pass').val(cipher);
        }
      });

      $('form.user-register-form, form.user-form', context).submit(function (event) {
        current_pass = $('#edit-current-pass').val();
        pass = $('#edit-pass-pass1').val();
        cpass = $('#edit-pass-pass2').val();

        if (pass !== '' && pass !== cpass) {
          if ($('span.error').length === 0) {
            $('#edit-pass-pass2').after('<span class="error" style="color: red;">Password doesn\'t match. Please enter correct password.</span>');
          }
          $('#edit-pass-pass2').addClass('error').focus();
          event.preventDefault();
          return false;
        }

        if (current_pass && current_pass !== '') {
          console.log('Encrypting current_pass with key:', passkey);
          cipher = CryptoJS.AES.encrypt(current_pass, passkey).toString();
          $('#edit-current-pass').val(cipher);
        }

        if (pass && pass !== '') {
          console.log('Encrypting new pass with key:', passkey);
          cipher = CryptoJS.AES.encrypt(pass, passkey).toString();
          $('#edit-pass-pass1').val(cipher);
          $('#edit-pass-pass2').val(cipher);
        }
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
