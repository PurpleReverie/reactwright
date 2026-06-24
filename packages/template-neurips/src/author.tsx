import "reactwright/jsx";
import React from "react";

// NeurIPS author-block helpers.
//
// The engine's author <slot> renders a single string, but NeurIPS sets
// each author as a centered, multi-line card (bold name; regular
// affiliation/address; monospace email) with co-authors placed side by
// side. We express this as one `<meta name="author">` per author and
// let the template's `.nips-author` rule lay them out.
//
//   const document = (
//     <document title="...">
//       {authorMetas(AUTHORS)}
//       ...content...
//     </document>
//   );
//
// or, lower level:
//
//   <meta name="author"><AuthorCard {...author} /></meta>

export type NeurIPSAuthor = {
  name: string;
  affiliation?: string;
  // Optional second affiliation/address line (e.g. city, country).
  address?: string;
  email?: string;
};

// The inner card for one author. Name is bold; affiliation and address
// are regular; the email is monospace. Matches the neurips_2025.sty
// author tabular (name / affiliation / address / email).
export function AuthorCard({ name, affiliation, address, email }: NeurIPSAuthor): React.ReactElement {
  return (
    <>
      <strong>{name}</strong>
      {affiliation != null ? (
        <>
          <br />
          {affiliation}
        </>
      ) : null}
      {address != null ? (
        <>
          <br />
          {address}
        </>
      ) : null}
      {email != null ? (
        <>
          <br />
          <code>{email}</code>
        </>
      ) : null}
    </>
  );
}

// Build the `<meta name="author">` entries for a list of authors. Spread
// the result into a `<document>`'s children; the template routes them
// to the author slot and lays them out side by side.
//
// `key` isn't part of the <meta> prop type (see CLAUDE.md "key prop on
// intrinsics"), so stamp it with cloneElement the way the markdown
// package does.
export function authorMetas(authors: NeurIPSAuthor[]): React.ReactElement[] {
  return authors.map((author, i) =>
    React.cloneElement(
      <meta name="author">
        <AuthorCard {...author} />
      </meta>,
      { key: `nips-author-${i}` }
    )
  );
}
