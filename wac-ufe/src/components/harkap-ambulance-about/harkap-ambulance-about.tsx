import { Component, Host, h } from '@stencil/core';
import { t } from '../../utils/i18n';
import { GITHUB_URL, PORTFOLIO_URL } from '../../utils/links';

/** One row of boxes joined by arrows; wraps into a column on narrow screens. */
const Flow = ({ steps }: { steps: string[] }) => (
  <ol class="flow">
    {steps.map(step => (
      <li>{step}</li>
    ))}
  </ol>
);

@Component({
  tag: 'harkap-ambulance-about',
  styleUrls: ['harkap-ambulance-about.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceAbout {
  render() {
    const m = t().about;
    const shell = t().shell;
    return (
      <Host>
        <article class="container">
          <header>
            <p class="eyebrow">{m.eyebrow}</p>
            <h1>Ambulance Devices</h1>
            <p class="lead">{m.lead}</p>
          </header>

          <section>
            <h2>{m.whatTitle}</h2>
            <ul>
              {m.what.map(item => (
                <li>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{m.tipsTitle}</h2>
            <ul>
              {m.tips.map(item => (
                <li>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{m.courseTitle}</h2>
            <p>{m.course}</p>
          </section>

          <section>
            <h2>{m.architectureTitle}</h2>
            <div class="card">
              <h3>{m.liveTitle}</h3>
              <Flow steps={m.live} />
              <p class="note">{m.liveNote}</p>
            </div>
            <div class="card">
              <h3>{m.courseSetupTitle}</h3>
              <Flow steps={m.courseSetup} />
              <p class="note">{m.courseSetupNote}</p>
            </div>
          </section>

          <section>
            <h2>{m.stackTitle}</h2>
            <dl class="stack">{m.stack.map(([area, tools]) => [<dt>{area}</dt>, <dd>{tools}</dd>])}</dl>
          </section>

          <section>
            <h2>{m.changesTitle}</h2>
            <ul>
              {m.changes.map(item => (
                <li>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>{m.linksTitle}</h2>
            <div class="links">
              <md-filled-button href={GITHUB_URL}>
                <md-icon slot="icon">code</md-icon>
                {m.sourceCode}
              </md-filled-button>
              <md-outlined-button href="/api-docs/">
                <md-icon slot="icon">api</md-icon>
                {shell.apiDocs}
              </md-outlined-button>
              <md-outlined-button href={PORTFOLIO_URL}>
                <md-icon slot="icon">person</md-icon>
                {shell.portfolio}
              </md-outlined-button>
            </div>
          </section>
        </article>
      </Host>
    );
  }
}
