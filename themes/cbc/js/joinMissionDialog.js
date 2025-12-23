/**
 * @file
 * Ensures CBC join mission webforms use enhanced dialog styling.
 */

(function (Drupal, once) {
  Drupal.behaviors.cbcJoinMissionDialogEnhancements = {
    attach(context) {
      once('cbc-join-dialog-listener', 'body', context).forEach(() => {
        window.addEventListener('dialog:aftercreate', (event) => {
          const dialogInstance = event.dialog;
          const dialogContent = event.target;

          if (!dialogInstance || !dialogContent) {
            return;
          }

          const hasIndividualForm = dialogContent.querySelector(
            '.webform-submission-individual-application-form-form',
          );
          const hasOrganisationForm = dialogContent.querySelector(
            '.webform-submission-organisations-form-form',
          );

          if (!hasIndividualForm && !hasOrganisationForm) {
            return;
          }

          const dialogWrapper = dialogContent.closest('.ui-dialog');
          if (dialogWrapper) {
            dialogWrapper.classList.add('cbc-join-form-dialog');
          }
        });
      });
    },
  };
})(Drupal, once);

