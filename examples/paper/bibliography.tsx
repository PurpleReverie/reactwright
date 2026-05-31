import { createBibliography } from "@reactwright/template-ieee";

// One central, typed bibliography for the paper. Every section file
// imports { Cite } from here and the type system rejects citations to
// keys not declared below. Add a key here, use it anywhere.
export const refs = createBibliography({
  knuth1984: {
    authors: "D. E. Knuth",
    title: "The TeXbook",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 1984
  },
  lamport1986: {
    authors: "L. Lamport",
    title: "LaTeX: A Document Preparation System",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 1986
  },
  bringhurst2004: {
    authors: "R. Bringhurst",
    title: "The Elements of Typographic Style",
    edition: "3rd ed.",
    location: "Vancouver, BC",
    publisher: "Hartley & Marks",
    year: 2004
  },
  tufte1983: {
    authors: "E. R. Tufte",
    title: "The Visual Display of Quantitative Information",
    location: "Cheshire, CT",
    publisher: "Graphics Press",
    year: 1983
  },
  raskin2000: {
    authors: "J. Raskin",
    title: "The Humane Interface",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 2000
  },
  kernighan1976: {
    authors: "B. W. Kernighan and P. J. Plauger",
    title: "Software Tools",
    location: "Reading, MA",
    publisher: "Addison-Wesley",
    year: 1976
  },
  shannon1948: {
    authors: "C. E. Shannon",
    title: "A Mathematical Theory of Communication",
    venue: "Bell System Technical Journal",
    volume: "27",
    pages: "379-423",
    year: 1948
  },
  pagedjs2020: {
    authors: "J. Cabane and F. Brisard",
    title: "Paged.js: a free and open-source library to display paginated content in the browser",
    venue: "Coko Foundation Technical Report",
    year: 2020
  },
  w3cGcpm2014: {
    authors: "H. Lie",
    title: "CSS Generated Content for Paged Media Module",
    venue: "W3C Working Draft",
    year: 2014
  },
  abelson1996: {
    authors: "H. Abelson and G. J. Sussman",
    title: "Structure and Interpretation of Computer Programs",
    edition: "2nd ed.",
    location: "Cambridge, MA",
    publisher: "MIT Press",
    year: 1996
  },
  reactReconciler2017: {
    authors: "A. Clark",
    title: "React as a UI Runtime",
    venue: "Overreacted (blog)",
    year: 2017
  },
  kindersley1969: {
    authors: "D. Kindersley",
    title: "Optical Letter Spacing for New Printing Systems",
    location: "London, UK",
    publisher: "Lund Humphries",
    year: 1969
  }
});

export const { Cite, RefList } = refs;
