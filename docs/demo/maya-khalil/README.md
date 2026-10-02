# Maya Khalil - fictional Rasikh demo

**FAKE / FICTIONAL DEMO - NO OFFICIAL VALIDITY.** All people, issuers, identifiers, amounts, quotes and case events in this pack are invented. Amman, Jordan, Abu Dhabi and Al Reem Island are real story settings. Every document carries visible fictional labels; the PDF and PNGs also have a watermark and footer. There are no official crests, valid passport numbers, MRZs, IBANs, real signatures or bank accounts.

Maya is a 30-year-old machine learning engineer moving from Amman to Abu Dhabi for a job with the imaginary employer **Demo Harbor AI**. She has an accepted offer, private prior savings, two weeks of temporary housing and a request for a one-bedroom home. HR, the landlord and a future bank each need different information and have different next actions. Her story demonstrates the handoffs Rasikh aims to coordinate and the newcomer's control over sharing.

## Open the pack

- [Nine-page PDF](output/pdf/maya-khalil-demo-pack.pdf): character profile, 90-second presenter guide and seven supporting specimens
- [Complete ZIP bundle](maya-khalil-demo-bundle.zip): PDF, individual PNGs, text companions, editable authoring data and rebuild scripts
- [Character data](character.json) and [document manifest](document-manifest.json)
- [Plain-text usage guide](START-HERE.txt)

| Supporting document                    | Image                                                | Text                                                 |
| -------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Passport details specimen              | [PNG](documents/01-passport-specimen.png)            | [TXT](documents/01-passport-specimen.txt)            |
| Employment offer                       | [PNG](documents/02-employment-offer.png)             | [TXT](documents/02-employment-offer.txt)             |
| Prior-bank statement                   | [PNG](documents/03-prior-bank-statement.png)         | [TXT](documents/03-prior-bank-statement.txt)         |
| Degree record                          | [PNG](documents/04-degree-record.png)                | [TXT](documents/04-degree-record.txt)                |
| Employer relocation support            | [PNG](documents/05-employer-support.png)             | [TXT](documents/05-employer-support.txt)             |
| Housing request                        | [PNG](documents/06-housing-request.png)              | [TXT](documents/06-housing-request.txt)              |
| Landlord summary and simulated consent | [PNG](documents/07-landlord-summary-and-consent.png) | [TXT](documents/07-landlord-summary-and-consent.txt) |

## Present the scenario

Introduce Maya, extract and confirm her passport fields, prepare a housing request with employer support, then stage the privacy moment: the full offer contains salary data and cannot be sent to the landlord under the proposed demo policy. Maya approves only the minimal housing packet and a separate derived budget-fit result. Finish at **pending landlord review**. All provider actions, consent events and status changes are simulated.

Her annual rent request is AED 84,000, equivalent to AED 7,000 per month, within her invented AED 8,000 monthly housing budget. Four instalments of AED 21,000 are a request awaiting landlord agreement. The result is not a verified income assessment or credit score. Her offered salary is projected income, not a payslip; employer support is not a rent guarantee. Bank eligibility, payment method, deposits, fees and provider requirements remain to be confirmed.

## Application integration limits

This is standalone presentation material. The JSON files are **authoring metadata, not app-import fixtures**. Narrative `tags` are not Guard data labels. Maya uses distinct identifiers such as `hire_demo_maya_001`; this pack does not replace the Alex Demo identity, `hire_demo_001`, seeds or evaluation caches on the separately inspected runtime/evaluation branches.

The passport, prior-bank and degree text companions use `Label: value` fields matching the document-extraction implementation inspected on the separate agent-runtime branch. That implementation accepts `passport`, `bank_statement`, `emirates_id` and `degree`; it does not extract offers. Its existence on that branch does not establish deployment on `main`. No implemented PDF/image upload, live verification, external submission or partner approval is claimed by this pack.

Before future integration, map content into the actual application schema and Guard contract. A full offer needs both `employment` and `salary` labels; bank and degree payloads use `bank_statement` and `degree`, and housing/address data uses `address`. Create and observe a new derived reference before checking a derived financial signal. Changing a raw offer's flag is insufficient. A housing approval grants no bank permission, and passport sharing needs separate consent for each destination. Keep the visibly fictional labels in the application too.

## Rebuild the assets

Use Python 3.10 or later and Poppler's `pdftoppm`. Install Poppler with your operating system's package manager. From the repository, open `docs/demo/maya-khalil/`; from the ZIP, open the extracted `maya-khalil-demo-pack/` directory. Run these commands inside that folder:

```sh
python3 -m venv /tmp/rasikh-demo-venv
/tmp/rasikh-demo-venv/bin/python -m pip install -r requirements.txt
/tmp/rasikh-demo-venv/bin/python rebuild_assets.py
```

Edit the character and document definitions in `build_demo_pack.py`, then rebuild. The rebuild command writes the PDF, seven text companions, authoring JSON, usage guide, seven PNGs at 120 dpi and the ZIP bundle. Review all PDF pages after content edits and check the fictional labels, dates, amounts and recipient boundaries before publishing.
