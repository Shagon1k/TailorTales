# Personal-data breach response

> Internal operating procedure for TailorTales. It supports, but does not replace, legal advice.
> Owner: Hurynovich Aliaksei. Effective: 5 August 2026. Review after every incident and at least
> annually.

## First 24 hours

| When        | Action                                                                                                                                         | Evidence                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Immediately | Contain the issue: revoke exposed credentials, restrict access, pause affected processing or deploy a fix.                                     | Incident timeline, commands, deploy links |
| Immediately | Preserve evidence without copying unnecessary personal data: logs, provider alerts, affected systems and time range.                           | Secure incident folder / links            |
| Within 24h  | Record what happened, data categories, approximate people affected, likely consequences and containment status.                                | Breach register entry                     |
| Within 24h  | Contact affected processors where necessary (AWS, OpenRouter, Paddle, Resend, Google, Sentry, New Relic) and follow their incident procedures. | Support tickets / responses               |

## Risk decision and notification

| Decision                      | Required action                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No risk to people is likely   | Record the assessment and closure in the breach register.                                                                                                          |
| Risk to people is likely      | Notify the Lithuanian State Data Protection Inspectorate (VDAI) without undue delay and, where feasible, within 72 hours of becoming aware. If late, document why. |
| High risk to people is likely | Also notify affected people without undue delay in clear language: what happened, likely consequences, containment, and how to contact us.                         |

For every incident, record the decision maker, reasoning, notification timestamps and the source
data supporting the assessment. Do not wait for a perfect investigation before containing the
issue or taking a timely notification decision.

## Closure and follow-up

1. Confirm the immediate issue is contained and service behaviour is safe.
2. Complete the breach-register entry, including incidents that did not require notification.
3. Create a remediation task for each root cause and track it to completion.
4. Review this procedure and the affected Privacy Notice/processor documentation after the
   incident.

## Contacts

- Privacy contact: `privacy@tailortales.app`
- Support contact: `support@tailortales.app`
- Controller: Hurynovich Aliaksei, Konstitucijos pr. 9-11, LT-09308, Vilnius, Lithuania
- Supervisory authority: State Data Protection Inspectorate of Lithuania (VDAI)
