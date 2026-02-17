/**
 * @file
 * Form Accessibility Enhancements.
 */

(function ($, Drupal) {
    'use strict';

    Drupal.behaviors.formAccessibility = {
        attach: function (context, settings) {
            // 1. Add instruction for mandatory fields if not present.
            $('form', context).once('form-required-instruction').each(function () {
                const $form = $(this);
                if ($form.find('.form-required').length > 0) {
                    const $instruction = $('<div class="form-required-instruction mb-3"><small><strong><span style="color: red;">*</span> denotes mandatory fields</strong></small></div>');
                    $form.prepend($instruction);
                }
            });

            // 2. Handle focus and aria-describedby for errors.
            // We look for errors within the current context (useful for AJAX).
            const $errorMessages = $('.form-item--error-message', context);

            if ($errorMessages.length > 0) {
                $errorMessages.each(function () {
                    const $error = $(this);
                    const $formItem = $error.closest('.js-form-item');

                    if ($formItem.length) {
                        const $input = $formItem.find('input, select, textarea');

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
                        }
                    }
                });

                // 3. Focus and highlight the first field with an error.
                // Use the first error message to find its associated input for better reliability.
                const $firstError = $errorMessages.first();
                const $firstFormItem = $firstError.closest('.js-form-item');
                const $firstErrorInput = $firstFormItem.find('input, select, textarea').first();

                if ($firstErrorInput.length) {
                    // Add a temporary highlight class to the error message.
                    $firstError.addClass('error-highlight-flash');
                    setTimeout(() => {
                        $firstError.removeClass('error-highlight-flash');
                    }, 3000);

                    // Delay focus slightly to ensure smooth scrolling isn't interrupted and 
                    // to overcome any Drupal AJAX focus theft.
                    setTimeout(() => {
                        $firstErrorInput.focus();

                        // Explicit scrolling to account for fixed headers.
                        const headerOffset = 150; // Adjust based on site header height.
                        const elementPosition = $firstErrorInput.offset().top;
                        const offsetPosition = elementPosition - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 200); // Slightly longer delay for stability.
                }
            }
        }
    };


})(jQuery, Drupal);

