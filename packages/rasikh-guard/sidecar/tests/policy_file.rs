//! The policy loader refuses anything that could fall through to an implicit allow.

use rasikh_guard::contract::{DataLabel, Destination};
use rasikh_guard::policy::{DEFAULT_POLICY_TOML, Effect, Policy, PolicyError, ReasonKind};

#[test]
fn shipped_policy_loads_and_says_it_is_not_legal_advice() {
    Policy::from_toml_str(DEFAULT_POLICY_TOML).expect("shipped policy loads");
    assert!(DEFAULT_POLICY_TOML.contains("PRODUCT DEFAULTS FOR THE DEMO. THEY ARE NOT LEGAL STATEMENTS."));
}

#[test]
fn a_missing_cell_is_a_load_error() {
    let without_cell = DEFAULT_POLICY_TOML.replacen("school = \"deny\"\n", "", 1);
    assert_eq!(
        Policy::from_toml_str(&without_cell).unwrap_err(),
        PolicyError::MissingCell {
            label: "passport",
            destination: "school"
        }
    );
}

#[test]
fn unknown_labels_destinations_effects_and_keys_are_refused() {
    for (from, to) in [
        ("[matrix.health]", "[matrix.blood_type]"),
        ("newcomer = \"allow\"", "neighbour = \"allow\""),
        ("tamm = \"insurance_only\"", "tamm = \"maybe\""),
        ("version = 1", "version = 1\nsurprise = true"),
    ] {
        let tampered = DEFAULT_POLICY_TOML.replacen(from, to, 1);
        assert!(
            matches!(Policy::from_toml_str(&tampered), Err(PolicyError::Parse(_))),
            "accepted {to}"
        );
    }
}

#[test]
fn only_version_1_loads() {
    let tampered = DEFAULT_POLICY_TOML.replacen("version = 1", "version = 2", 1);
    assert_eq!(
        Policy::from_toml_str(&tampered).unwrap_err(),
        PolicyError::UnsupportedVersion { found: 2 }
    );
}

#[test]
fn reasons_are_plain_language_without_rule_ids() {
    let policy = Policy::default_policy();
    assert_eq!(
        policy.reason(ReasonKind::Consent, DataLabel::Passport, Destination::Landlord),
        "Your passport has not been shared with landlords yet."
    );
    assert_eq!(
        policy.reason(ReasonKind::InsuranceOnly, DataLabel::Health, Destination::Tamm),
        "Health details can only be shared for insurance services."
    );
    for label in DataLabel::ALL {
        for destination in Destination::ALL {
            let kind = policy.effect(label, destination).into();
            let reason = policy.reason(kind, label, destination);
            assert!(
                !reason.contains('{') && !reason.contains('_'),
                "template or wire name leaked into {reason}"
            );
            assert!(reason.ends_with('.'), "reason is a sentence: {reason}");
        }
    }
}

#[test]
fn rule_ids_follow_label_destination_effect() {
    let policy = Policy::default_policy();
    assert_eq!(
        policy.rule_id(DataLabel::Passport, Destination::Landlord),
        "passport.landlord.requires_consent"
    );
    assert_eq!(
        policy.rule_id(DataLabel::Health, Destination::Tamm),
        "health.tamm.insurance_only"
    );
    assert_eq!(
        policy.effect(DataLabel::Employment, Destination::Landlord),
        Effect::Allow
    );
}
