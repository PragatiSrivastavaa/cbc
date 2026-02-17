// Form Accessibility Enhancements
document.addEventListener('DOMContentLoaded', () => {
    // 1. Add instruction for mandatory fields if not present
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Check if form has required fields
        if (form.querySelector('.form-required')) {
            const instruction = document.createElement('div');
            instruction.className = 'form-required-instruction mb-3';
            instruction.innerHTML = '<small><strong><span style="color: red;">*</span> denotes mandatory fields</strong></small>';
            // Insert at top of form
            form.insertBefore(instruction, form.firstChild);
        }

        // 2. Focus first error on submit (Drupal often reloads, so we check on load)
        const firstError = form.querySelector('.form-item--error-message, .error, [aria-invalid="true"]');
        if (firstError) {
            // Find the input associated with this error
            const formItem = firstError.closest('.js-form-item');
            if (formItem) {
                const input = formItem.querySelector('input, select, textarea');
                if (input) {
                    input.focus();
                    // Ensure aria-describedby includes the error ID
                    if (!firstError.id) {
                        firstError.id = 'error-' + Math.random().toString(36).substr(2, 9);
                    }
                    const existingDescribedBy = input.getAttribute('aria-describedby') || '';
                    if (!existingDescribedBy.includes(firstError.id)) {
                        input.setAttribute('aria-describedby', (existingDescribedBy + ' ' + firstError.id).trim());
                    }
                }
            }
        }
    });
});
