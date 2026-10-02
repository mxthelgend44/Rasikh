//! Bridge to the vendored OpenAPPA engine's label algebra (`appa_engine::label`).
//!
//! Each data label flowing into a call becomes an OpenAPPA [`Label`] whose audience is the set
//! of Rasikh destinations that label may reach *in this call's context* (tool, service tags,
//! consents, raw or derived). The call's label is the engine's restrictive meet
//! ([`Label::combine`]: intersect audiences) over every flowing label, and the call may proceed
//! only if that folded audience still admits the destination. This is the engine's own
//! "can this value, derived from these sources, flow into this sink?" check, with Rasikh
//! destinations as literal readers.

use appa_engine::label::{Audience, Label, ReaderId, Trust};

use crate::contract::Destination;

/// One trust rank: Rasikh distinguishes data by audience, not by trust.
const TRUST: Trust = Trust::new(1);

/// The literal OpenAPPA reader for a destination. No `:` in the spelling, so the reader is
/// stable and restricted audiences intersect exactly.
fn reader(destination: Destination) -> ReaderId {
    ReaderId::new(format!("rasikh-{}", destination.as_str()))
}

/// The OpenAPPA label of one flowing data label: readable by exactly `reachable`.
pub fn label_for(reachable: impl IntoIterator<Item = Destination>) -> Label {
    Label::new(TRUST, Audience::restricted(reachable.into_iter().map(reader)))
}

/// The engine's fold over every flowing label. With nothing flowing it is [`Label::top`]
/// (public), which admits every destination.
pub fn fold(labels: impl IntoIterator<Item = Label>) -> Label {
    labels
        .into_iter()
        .fold(Label::top(), |call, label| call.combine(&label))
}

/// Does the folded label's audience include `destination`? Public admits everyone; otherwise
/// every clause of the canonical intersection must name the destination's reader.
pub fn admits(label: &Label, destination: Destination) -> bool {
    let reader = reader(destination);
    label.audience.is_public()
        || label
            .audience
            .clauses()
            .all(|clause| clause.readers().contains(&reader))
}

/// The destinations the folded label admits, in contract order (for explanations and tests).
pub fn admitted(label: &Label) -> Vec<Destination> {
    Destination::ALL
        .into_iter()
        .filter(|destination| admits(label, *destination))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use Destination::*;

    #[test]
    fn the_meet_intersects_audiences() {
        let passport = label_for([Tamm, Employer, Newcomer]);
        let employment = label_for([Tamm, Employer, Landlord, Bank, Newcomer]);
        assert_eq!(admitted(&fold([passport, employment])), vec![Tamm, Employer, Newcomer]);
    }

    #[test]
    fn an_empty_audience_admits_nobody_and_absorbs() {
        let nobody = label_for([]);
        assert!(admitted(&nobody).is_empty());
        assert!(admitted(&fold([label_for(Destination::ALL), nobody])).is_empty());
    }

    #[test]
    fn nothing_flowing_is_public() {
        assert_eq!(admitted(&fold([])), Destination::ALL.to_vec());
    }
}
