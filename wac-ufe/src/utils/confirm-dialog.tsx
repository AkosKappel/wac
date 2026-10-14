import { FunctionalComponent, h } from '@stencil/core';
import { t } from './i18n';

interface ConfirmDialogProps {
  open: boolean;
  headline: string;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: FunctionalComponent<ConfirmDialogProps> = ({ open, headline, text, onCancel, onConfirm }) => (
  <md-dialog type="alert" open={open} onClosed={onCancel}>
    <md-icon slot="icon">delete_forever</md-icon>
    <div slot="headline">{headline}</div>
    <div slot="content">{text}</div>
    <div slot="actions">
      <md-text-button onClick={onCancel}>{t().common.cancel}</md-text-button>
      <md-filled-button class="danger" onClick={onConfirm}>
        {t().common.delete}
      </md-filled-button>
    </div>
  </md-dialog>
);
