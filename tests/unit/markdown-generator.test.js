import { generateJobsMarkdown } from "../../src/markdown-generator.js";

const baseCompany = {
  id: "47473595",
  company: "GUSTURI DIVINE S.R.L.",
  brand: "GUSTURI DIVINE",
  status: "activ",
  location: ["București"],
  website: [],
  career: [],
  lastScraped: "2026-07-08"
};

const baseJob = {
  url: "https://www.anofm.ro/job/123",
  title: "Bucătar",
  workmode: "on-site",
  location: ["București"],
  tags: ["bucatar", "preparare"],
  status: "scraped"
};

describe("generateJobsMarkdown", () => {
  describe("company section", () => {
    it("includes company name as h1", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toContain("# GUSTURI DIVINE S.R.L.");
    });

    it("includes CIF", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toContain("47473595");
    });

    it("includes brand", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toContain("GUSTURI DIVINE");
    });

    it("includes status", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toContain("activ");
    });

    it("includes lastScraped date", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toContain("2026-07-08");
    });

    it("omits optional fields when not present", () => {
      const minimal = { id: "47473595", company: "GUSTURI DIVINE S.R.L." };
      const md = generateJobsMarkdown(minimal, []);
      expect(md).toContain("# GUSTURI DIVINE S.R.L.");
      expect(md).not.toContain("Brand");
      expect(md).not.toContain("Last Scraped");
    });
  });

  describe("jobs section", () => {
    it("shows job count in heading", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("## Current Job Listings (1)");
    });

    it("shows 0 when no jobs", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toContain("## Current Job Listings (0)");
    });

    it("includes job title as h3", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("### Bucătar");
    });

    it("includes job URL as markdown link", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("[https://www.anofm.ro/job/123]");
    });

    it("includes workmode", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("on-site");
    });

    it("includes location", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("București");
    });

    it("includes tags", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("bucatar, preparare");
    });

    it("includes status", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(md).toContain("scraped");
    });

    it("renders multiple jobs", () => {
      const job2 = { ...baseJob, title: "Ospătar", url: "https://www.anofm.ro/job/456" };
      const md = generateJobsMarkdown(baseCompany, [baseJob, job2]);
      expect(md).toContain("### Bucătar");
      expect(md).toContain("### Ospătar");
      expect(md).toContain("## Current Job Listings (2)");
    });

    it("handles job with no optional fields", () => {
      const minimal = { url: "https://www.anofm.ro/job/999", title: "Ajutor bucătar" };
      const md = generateJobsMarkdown(baseCompany, [minimal]);
      expect(md).toContain("### Ajutor bucătar");
      expect(md).not.toContain("Work Mode");
      expect(md).not.toContain("Tags");
    });
  });

  describe("output format", () => {
    it("returns a non-empty string", () => {
      const md = generateJobsMarkdown(baseCompany, [baseJob]);
      expect(typeof md).toBe("string");
      expect(md.length).toBeGreaterThan(0);
    });

    it("includes a generated timestamp", () => {
      const md = generateJobsMarkdown(baseCompany, []);
      expect(md).toMatch(/_Generated: \d{4}-\d{2}-\d{2}/);
    });
  });
});
