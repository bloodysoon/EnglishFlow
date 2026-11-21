import { Fragment } from "react";

type Falling = {
  word: string;
  box: number;
  place: string;
  right?: boolean;
  front?: boolean;
  nudge?: number;
}[];

// Text with some of its words marked to fall into the boxes of "How it
// works" (FallingWords): the words listed for this place in the
// dictionary's `falling`, each the first time it appears. `phones` also
// lets them fall on phones (only words still on screen when the boxes come).
export function FallText({
  text,
  place,
  falling,
  phones = false,
}: {
  text: string;
  place: string;
  falling: Falling;
  phones?: boolean;
}) {
  const picks = falling.filter((f) => f.place === place);
  if (!picks.length) return text;

  const used = new Set<string>();
  return text.split(" ").map((piece, i) => {
    const bare = piece.replace(/[.,;:!?„“”"—]/g, "");
    const pick = picks.find((f) => f.word === bare && !used.has(f.word));
    if (pick) used.add(pick.word);
    return (
      <Fragment key={i}>
        {i > 0 && " "}
        {pick ? (
          <span
            data-fall-source={pick.word}
            data-fall-target={pick.box || undefined}
            data-fall-phones={phones ? "" : undefined}
            // Its place among its box's cards, left to right.
            data-fall-at={falling
              .filter((f) => f.box === pick.box)
              .indexOf(pick)}
            data-fall-right={pick.right ? "" : undefined}
            data-fall-nudge={pick.nudge}
            data-fall-front={pick.front ? "" : undefined}
          >
            {piece}
          </span>
        ) : (
          piece
        )}
      </Fragment>
    );
  });
}
