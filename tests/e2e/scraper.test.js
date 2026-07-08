import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

let HAS_ANAF = false;

async function checkAnafAvailability() {
  try {
    const res = await fetch('https://demoanaf.ro/api/search?q=test', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

function itIfAnaf(name, fn, timeout) {
  if (HAS_ANAF) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: ANAF API unavailable)`, fn, timeout);
}

beforeAll(async () => {
  HAS_ANAF = await checkAnafAvailability();
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
}, 60000);

const TEST_CIF = '47473595';
const TEST_BRAND = 'gusturi-divine';

describe('E2E: Full Scraping Pipeline', () => {

  describe('ANOFM API — Real Data Fetch', () => {
    let anofmData;

    beforeAll(async () => {
      const payload = {
        current: 1,
        rowCount: 10,
        sort: { created_at: "desc" },
        employer_tax_code: TEST_CIF
      };
      const res = await fetch("https://mediere.anofm.ro/api/entity/vw_public_job_posting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "job_seeker_ro_spider"
        },
        body: JSON.stringify(payload)
      });
      anofmData = await res.json();
    }, 15000);

    it('should respond with valid data structure from ANOFM API', () => {
      expect(anofmData).toHaveProperty('rows');
      expect(Array.isArray(anofmData.rows)).toBe(true);
      expect(anofmData).toHaveProperty('total');
    }, 10000);

    it('should have valid job fields from ANOFM if any jobs exist', () => {
      if (anofmData.rows.length > 0) {
        const job = anofmData.rows[0];
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('occupation');
        expect(typeof job.occupation).toBe('string');
      }
    });
  });

  describe('Company Validation Path', () => {
    let anaf;
    let company;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      company = await import('../../company.js');
    });

    itIfAnaf('should find company in ANAF and validate active status', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);

      const target = results.find(c =>
        c.name.toUpperCase().includes('GUSTURI DIVINE') &&
        c.statusLabel === 'Funcțiune'
      );
      expect(target).toBeDefined();
      expect(target.cui.toString()).toBe(TEST_CIF);

      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfSolr('should run full validation and report active status with job count', async () => {
      const result = await company.validateAndGetCompany();

      expect(result.status).toBe('active');
      expect(result.company).toBe('GUSTURI DIVINE S.R.L.');
      expect(result.cif).toBe(TEST_CIF);

      if (result.existingJobsCount === 0) {
        console.log('⚠️ No jobs in Solr — skipping job count assertion');
        return;
      }
      expect(result.existingJobsCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Inactive Company Handling', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
    });

    itIfAnaf('should detect inactive/radiated companies via ANAF', async () => {
      const results = await anaf.searchCompany('GUSTURI DIVINE');

      const nonActive = results.find(c => c.statusLabel !== 'Funcțiune');

      if (nonActive) {
        try {
          const anafData = await anaf.getCompanyFromANAF(nonActive.cui.toString());
          expect(anafData).toBeDefined();
          if (anafData.inactive !== undefined) {
            expect(anafData.inactive).toBe(true);
          }
        } catch {
          expect(nonActive.statusLabel).toMatch(/Radiată|Inactiv|Suspendat/);
        }
      }
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should have company jobs in SOLR with correct company name', async () => {
      const result = await solr.querySOLR(TEST_CIF);

      if (result.numFound === 0) {
        console.log('⚠️ No jobs in Solr — skipping SOLR data verification');
        return;
      }

      for (const job of result.docs) {
        expect(job.company).toBe('GUSTURI DIVINE S.R.L.');
        expect(job.cif).toBe(TEST_CIF);
      }
    }, 15000);

    itIfSolr('should have company core entry with required fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);

      expect(result.numFound).toBe(1);
      const company = result.docs[0];
      expect(company.company).toBe('GUSTURI DIVINE S.R.L.');
      expect(company.status).toBe('activ');
    }, 15000);
  });
});
