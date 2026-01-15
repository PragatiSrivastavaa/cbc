/**
 * @file
 * Security fixes for client-side controls.
 */

(function ($, Drupal) {
    Drupal.behaviors.securityFixes = {
        attach: function (context, settings) {
            // Disable paste on password fields to prevent clipboard exposure
            // as per security requirements.
            // Note: This may impact password managers that rely on pasting,
            // but most modern ones use the automation API or autofill.
            $('input[type="password"]', context).on('paste', function (e) {
                e.preventDefault();
                return false;
            });

            // Also disable paste on username fields (usually 'name' in Drupal)
            // to prevent credentials leakage via clipboard history.
            // Target specific login forms (using starts-with for ID) to avoid affecting generic 'name' fields.
            $('form[id^="user-login"] input[name="name"]', context).on('paste', function (e) {
                e.preventDefault();
                return false;
            });

            // Prevent copy as well to avoid moving sensitive data to clipboard
            $('input[type="password"]', context).on('copy', function (e) {
                e.preventDefault();
                return false;
            });
        }
    };
})(jQuery, Drupal);
