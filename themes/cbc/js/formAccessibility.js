/**
 * @file
 * Form Accessibility Enhancements.
 */

(function ($, Drupal, once) {
    'use strict';

    Drupal.behaviors.formAccessibility = {
        attach: function (context, settings) {
            // 1. Add instruction for mandatory fields if not present.
            const forms = once('form-required-instruction', 'form', context);
            forms.forEach(function (form) {
                const $form = $(form);
                if ($form.find('.form-required').length > 0) {
                    const $instruction = $('<div class="form-required-instruction mb-3"><small><strong><span style="color: red;">*</span> denotes mandatory fields</strong></small></div>');
                    $form.prepend($instruction);
                }
            });

            // 2. Handle focus and aria-describedby for errors.
            // Wrap in a setTimeout to allow Drupal core/Webform scripts to finish 
            // their DOM manipulations and focus events first.
            setTimeout(() => {
                const $errorMessages = $('.form-item--error-message', context);

                if ($errorMessages.length > 0) {
                    // Ensure focus on the first input with an error regardless of markup
                    let firstErrorInputFound = false;

                    $errorMessages.each(function () {
                        const $error = $(this);

                        // Add role="alert" to the error message explicitly via JS just in case
                        $error.attr('role', 'alert');

                        // Determine the input. In Drupal, .form-item is usually the wrapper.
                        let $formItem = $error.closest('.form-item');
                        if (!$formItem.length) {
                            $formItem = $error.closest('div'); // Fallback
                        }

                        if ($formItem.length) {
                            const $input = $formItem.find('input:not([type="hidden"]), select, textarea').first();

                            if ($input.length) {
                                // Ensure the error message has a unique ID.
                                if (!$error.attr('id')) {
                                    const inputName = $input.attr('name') || 'field';
                                    $error.attr('id', 'error-' + inputName.replace(/[\[\]]/g, '-') + '-' + Math.random().toString(36).substr(2, 5));
                                }

                                // Link input to error message.
                                const errorId = $error.attr('id');
                                let describedBy = $input.attr('aria-describedby') || '';
                                if (!describedBy.includes(errorId)) {
                                    describedBy = (describedBy + ' ' + errorId).trim();
                                    $input.attr('aria-describedby', describedBy);
                                }

                                // Mark as invalid.
                                $input.attr('aria-invalid', 'true');

                                // 3. Focus and highlight the first field with an error.
                                if (!firstErrorInputFound) {
                                    firstErrorInputFound = true;

                                    $error.addClass('error-highlight-flash');
                                    setTimeout(() => {
                                        $error.removeClass('error-highlight-flash');
                                    }, 3000);

                                    // Small delay inside to ensure scrolling happens after native focus jumping
                                    setTimeout(() => {
                                        $input.focus();
                                        if ($input[0] && typeof $input[0].focus === 'function') {
                                            $input[0].focus();
                                        }

                                        const headerOffset = 180;
                                        const elementPosition = $input.offset().top;
                                        const offsetPosition = elementPosition - headerOffset;

                                        window.scrollTo({
                                            top: offsetPosition,
                                            behavior: 'smooth'
                                        });
                                    }, 100);
                                }
                            }
                        }
                    });
                }
            }, 500); // 500ms delay to run after other scripts
        }
    };

})(jQuery, Drupal, once);

