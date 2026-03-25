export type TalentProfileDocumentCategory = "cv" | "cover-letter" | "portfolio";

export type TalentProfileDocument = {
  id: string;
  name: string;
  size: string;
  date: string;
  category: TalentProfileDocumentCategory;
};

export const defaultTalentProfileDocuments: TalentProfileDocument[] = [
  {
    id: "resume-johndoe-2025",
    name: "Resume_JohnDoe_2025.pdf",
    size: "245 KB",
    date: "15/11/2025",
    category: "cv",
  },
  {
    id: "cover-letter-johndoe-2025",
    name: "Cover_Letter.pdf",
    size: "128 KB",
    date: "10/11/2025",
    category: "cover-letter",
  },
  {
    id: "portfolio-johndoe-2025",
    name: "Portfolio.pdf",
    size: "1.2 MB",
    date: "05/11/2025",
    category: "portfolio",
  },
];

export const getTalentProfileCvDocuments = () =>
  defaultTalentProfileDocuments.filter((document) => document.category === "cv");