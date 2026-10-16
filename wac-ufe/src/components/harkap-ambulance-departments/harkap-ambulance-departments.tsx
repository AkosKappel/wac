import { Component, Host, Prop, State, h } from '@stencil/core';
import { Department } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { ConfirmDialog } from '../../utils/confirm-dialog';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
import { t } from '../../utils/i18n';
import { hrefTo, validateOnBlur } from '../../utils/utils';

@Component({
  tag: 'harkap-ambulance-departments',
  styleUrls: ['harkap-ambulance-departments.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceDepartments {
  @Prop() apiBase: string;
  @Prop() basePath: string = '';
  @State() departments: Department[];
  /** devices per department code, from the statistics */
  @State() deviceCounts: Record<string, number> = {};
  @State() errorMessage: string;
  @State() errorStatus: number;
  /** the department in the form dialog; isNew when it is not stored yet */
  @State() editing: Department & { isNew?: boolean };
  @State() deleting: Department;
  @State() actionError: string;
  @State() busy = false;

  componentWillLoad() {
    this.load();
  }

  private async load() {
    const api = apiClients(this.apiBase);
    try {
      const [departments, stats] = await Promise.all([api.departments.getDepartments(), api.stats.getStats()]);
      this.departments = departments ?? [];
      this.deviceCounts = Object.fromEntries(stats.departments.map(d => [d.code, d.count]));
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().departments.loadFailed}: ${message}`;
    }
  }

  private async save() {
    const { isNew, ...department } = this.editing;
    this.busy = true;
    this.actionError = undefined;
    try {
      const api = apiClients(this.apiBase).departments;
      if (isNew) {
        await api.createDepartment({ department });
      } else {
        await api.updateDepartment({ code: department.code, department });
      }
      this.editing = undefined;
      await this.load();
    } catch (err) {
      this.actionError = `${t().departments.saveFailed}: ${(await apiError(err)).message}`;
    } finally {
      this.busy = false;
    }
  }

  private async delete(department: Department) {
    this.deleting = undefined;
    this.busy = true;
    this.actionError = undefined;
    try {
      await apiClients(this.apiBase).departments.deleteDepartment({ code: department.code });
      await this.load();
    } catch (err) {
      const { status, message } = await apiError(err);
      this.actionError = status === 409 ? t().departments.inUse : `${t().departments.deleteFailed}: ${message}`;
    } finally {
      this.busy = false;
    }
  }

  private isValid() {
    const d = this.editing;
    return d && /^[a-z0-9-]{1,50}$/.test(d.code ?? '') && d.name?.trim();
  }

  private field(key: keyof Department, label: string, props: Record<string, unknown> = {}) {
    return (
      <md-outlined-text-field
        label={label}
        value={(this.editing[key] as string) ?? ''}
        oninput={(ev: InputEvent) => (this.editing = { ...this.editing, [key]: (ev.target as HTMLInputElement).value })}
        {...props}
      ></md-outlined-text-field>
    );
  }

  render() {
    const m = t().departments;
    if (this.errorMessage) {
      return (
        <Host>
          <ErrorPage status={this.errorStatus} message={this.errorMessage} />
        </Host>
      );
    }
    return (
      <Host>
        <div class="container">
          <header class="page-header">
            <div>
              <p class="eyebrow">{m.eyebrow}</p>
              <h1>{m.title}</h1>
            </div>
            <md-filled-button
              onClick={() => {
                this.actionError = undefined;
                this.editing = { code: '', name: '', floor: '', head: '', isNew: true };
              }}
            >
              <md-icon slot="icon">add</md-icon>
              {m.add}
            </md-filled-button>
          </header>

          {this.actionError && !this.editing && (
            <div class="banner" role="alert">
              <md-icon aria-hidden="true">error</md-icon>
              <span>{this.actionError}</span>
            </div>
          )}

          {!this.departments ? (
            <div class="card">
              <SkeletonRows count={4} />
            </div>
          ) : this.departments.length === 0 ? (
            <p class="empty">{m.empty}</p>
          ) : (
            <ul class="departments">
              {this.departments.map(department => {
                const count = this.deviceCounts[department.code] ?? 0;
                return (
                  <li class="card department">
                    <div class="department-main">
                      <h2>{department.name}</h2>
                      <p class="meta">
                        <span class="code">{department.code}</span>
                        {department.floor && <span>{m.floorLabel(department.floor)}</span>}
                        <a href={hrefTo(this.basePath, `./devices?department=${encodeURIComponent(department.code)}`)}>
                          {m.devices(count)}
                        </a>
                      </p>
                      {department.head && (
                        <p class="head">
                          <md-icon aria-hidden="true">person</md-icon>
                          {department.head}
                        </p>
                      )}
                    </div>
                    <div class="department-actions">
                      <md-icon-button
                        aria-label={`${m.edit}: ${department.name}`}
                        title={m.edit}
                        onClick={() => {
                          this.actionError = undefined;
                          this.editing = { ...department };
                        }}
                      >
                        <md-icon aria-hidden="true">edit</md-icon>
                      </md-icon-button>
                      <md-icon-button
                        aria-label={`${t().common.delete}: ${department.name}`}
                        title={count ? m.inUse : t().common.delete}
                        disabled={count > 0 || this.busy}
                        onClick={() => (this.deleting = department)}
                      >
                        <md-icon aria-hidden="true">delete</md-icon>
                      </md-icon-button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <md-dialog open={!!this.editing} onClosed={() => (this.editing = undefined)}>
          <div slot="headline">{this.editing?.isNew ? m.titleNew : m.titleEdit}</div>
          {this.editing && (
            <form slot="content" id="department-form" method="dialog" onFocusout={validateOnBlur}>
              {this.field('code', m.code, {
                required: true,
                disabled: !this.editing.isNew,
                maxLength: 50,
                pattern: '[a-z0-9\\-]+',
                supportingText: m.codeHint,
              })}
              {this.field('name', m.name, { required: true, maxLength: 100 })}
              {this.field('floor', m.floor, { maxLength: 20 })}
              {this.field('head', m.head, { maxLength: 100 })}
              {this.actionError && (
                <div class="banner" role="alert">
                  <md-icon aria-hidden="true">error</md-icon>
                  <span>{this.actionError}</span>
                </div>
              )}
            </form>
          )}
          <div slot="actions">
            <md-text-button onClick={() => (this.editing = undefined)}>{t().common.cancel}</md-text-button>
            <md-filled-button disabled={!this.isValid() || this.busy} onClick={() => this.save()}>
              {this.busy ? t().common.saving : t().common.save}
            </md-filled-button>
          </div>
        </md-dialog>

        <ConfirmDialog
          open={!!this.deleting}
          headline={m.deleteTitle}
          text={m.deleteText(this.deleting?.name ?? '')}
          onCancel={() => (this.deleting = undefined)}
          onConfirm={() => this.delete(this.deleting)}
        />
      </Host>
    );
  }
}
