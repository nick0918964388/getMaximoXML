/**
 * Tests for MAS pod/deployment helper functions
 */
import { describe, expect, it } from 'vitest';
import {
  MAS_RESOURCE_KINDS,
  deriveMasStem,
  buildMasPrefixes,
  isMasResource,
  parseMasResourceKind,
  formatAge,
} from '../pod-manager-types';

describe('MAS_RESOURCE_KINDS', () => {
  it('should contain all expected MAS manage resource kinds', () => {
    expect(MAS_RESOURCE_KINDS).toContain('all');
    expect(MAS_RESOURCE_KINDS).toContain('cron');
    expect(MAS_RESOURCE_KINDS).toContain('maxinst');
    expect(MAS_RESOURCE_KINDS).toContain('mea');
    expect(MAS_RESOURCE_KINDS).toContain('report');
    expect(MAS_RESOURCE_KINDS).toContain('ui');
    expect(MAS_RESOURCE_KINDS).toHaveLength(6);
  });
});

describe('deriveMasStem', () => {
  it('should extract stem from default podPrefix', () => {
    expect(deriveMasStem('mas-masw-manage-maxinst-')).toBe('mas-masw-manage-');
  });

  it('should extract stem from different instance prefixes', () => {
    expect(deriveMasStem('mas-inst2-manage-maxinst-')).toBe('mas-inst2-manage-');
    expect(deriveMasStem('mas-prod-manage-ui-')).toBe('mas-prod-manage-');
    expect(deriveMasStem('mas-dev-manage-cron-')).toBe('mas-dev-manage-');
  });

  it('should return the podPrefix as-is if no known kind found', () => {
    expect(deriveMasStem('custom-prefix-')).toBe('custom-prefix-');
    expect(deriveMasStem('my-app-')).toBe('my-app-');
  });

  it('should handle podPrefix without trailing dash', () => {
    expect(deriveMasStem('mas-masw-manage-maxinst')).toBe('mas-masw-manage-');
  });
});

describe('buildMasPrefixes', () => {
  it('should build prefixes from default podPrefix', () => {
    const prefixes = buildMasPrefixes('mas-masw-manage-maxinst-');
    expect(prefixes).toContain('mas-masw-manage-all-');
    expect(prefixes).toContain('mas-masw-manage-cron-');
    expect(prefixes).toContain('mas-masw-manage-maxinst-');
    expect(prefixes).toContain('mas-masw-manage-mea-');
    expect(prefixes).toContain('mas-masw-manage-report-');
    expect(prefixes).toContain('mas-masw-manage-ui-');
    expect(prefixes).toHaveLength(6);
  });

  it('should build prefixes from a different instance', () => {
    const prefixes = buildMasPrefixes('mas-inst2-manage-maxinst-');
    expect(prefixes).toContain('mas-inst2-manage-all-');
    expect(prefixes).toContain('mas-inst2-manage-cron-');
    expect(prefixes).toContain('mas-inst2-manage-maxinst-');
    expect(prefixes).toContain('mas-inst2-manage-mea-');
    expect(prefixes).toContain('mas-inst2-manage-report-');
    expect(prefixes).toContain('mas-inst2-manage-ui-');
  });
});

describe('isMasResource', () => {
  it('should return true for names matching default MAS prefixes', () => {
    expect(isMasResource('mas-masw-manage-all-abc123')).toBe(true);
    expect(isMasResource('mas-masw-manage-cron-xyz')).toBe(true);
    expect(isMasResource('mas-masw-manage-maxinst-pod1')).toBe(true);
    expect(isMasResource('mas-masw-manage-mea-abc')).toBe(true);
    expect(isMasResource('mas-masw-manage-report-def')).toBe(true);
    expect(isMasResource('mas-masw-manage-ui-ghi')).toBe(true);
  });

  it('should return false for non-MAS names', () => {
    expect(isMasResource('nginx-deployment-abc')).toBe(false);
    expect(isMasResource('some-other-pod')).toBe(false);
    expect(isMasResource('')).toBe(false);
  });

  it('should return false for partial prefix matches', () => {
    expect(isMasResource('mas-masw-manage-al')).toBe(false);
    expect(isMasResource('mas-masw-manage-')).toBe(false);
  });

  it('should use custom podPrefix when provided', () => {
    const prefix = 'mas-inst2-manage-maxinst-';
    expect(isMasResource('mas-inst2-manage-all-abc123', prefix)).toBe(true);
    expect(isMasResource('mas-inst2-manage-ui-xyz', prefix)).toBe(true);
    // Default prefix should NOT match when custom is used
    expect(isMasResource('mas-masw-manage-all-abc123', prefix)).toBe(false);
  });

  it('should match deployment names (exact base name without hash suffix)', () => {
    // Deployment names are like "mas-masw-manage-all" (no trailing hash)
    expect(isMasResource('mas-masw-manage-all')).toBe(true);
    expect(isMasResource('mas-masw-manage-cron')).toBe(true);
    expect(isMasResource('mas-masw-manage-maxinst')).toBe(true);
    expect(isMasResource('mas-masw-manage-ui')).toBe(true);
  });

  it('should match deployment names with custom podPrefix', () => {
    const prefix = 'mas-masw-maxinst-';
    // Pod names (with hash suffix)
    expect(isMasResource('mas-masw-all-78b578576d-xgwvn', prefix)).toBe(true);
    // Deployment names (exact, no hash)
    expect(isMasResource('mas-masw-all', prefix)).toBe(true);
    expect(isMasResource('mas-masw-cron', prefix)).toBe(true);
    expect(isMasResource('mas-masw-ui', prefix)).toBe(true);
  });
});

describe('parseMasResourceKind', () => {
  it('should extract kind from MAS resource names', () => {
    expect(parseMasResourceKind('mas-masw-manage-all-abc123')).toBe('all');
    expect(parseMasResourceKind('mas-masw-manage-cron-xyz')).toBe('cron');
    expect(parseMasResourceKind('mas-masw-manage-maxinst-pod1')).toBe('maxinst');
    expect(parseMasResourceKind('mas-masw-manage-mea-abc')).toBe('mea');
    expect(parseMasResourceKind('mas-masw-manage-report-def')).toBe('report');
    expect(parseMasResourceKind('mas-masw-manage-ui-ghi')).toBe('ui');
  });

  it('should return "unknown" for non-MAS names', () => {
    expect(parseMasResourceKind('nginx-deployment-abc')).toBe('unknown');
    expect(parseMasResourceKind('')).toBe('unknown');
  });

  it('should extract kind with custom podPrefix', () => {
    const prefix = 'mas-inst2-manage-maxinst-';
    expect(parseMasResourceKind('mas-inst2-manage-all-abc123', prefix)).toBe('all');
    expect(parseMasResourceKind('mas-inst2-manage-ui-xyz', prefix)).toBe('ui');
  });

  it('should extract kind from deployment names (exact base name)', () => {
    expect(parseMasResourceKind('mas-masw-manage-all')).toBe('all');
    expect(parseMasResourceKind('mas-masw-manage-cron')).toBe('cron');
    expect(parseMasResourceKind('mas-masw-manage-ui')).toBe('ui');
  });

  it('should extract kind from deployment names with custom podPrefix', () => {
    const prefix = 'mas-masw-maxinst-';
    expect(parseMasResourceKind('mas-masw-all', prefix)).toBe('all');
    expect(parseMasResourceKind('mas-masw-ui', prefix)).toBe('ui');
  });
});

describe('formatAge', () => {
  it('should format age in days for > 24 hours', () => {
    const now = new Date('2026-02-06T12:00:00Z');
    const twoAndHalfDaysAgo = new Date('2026-02-04T00:00:00Z');
    expect(formatAge(twoAndHalfDaysAgo.toISOString(), now)).toBe('2d');
  });

  it('should format age in hours for > 60 minutes and < 24 hours', () => {
    const now = new Date('2026-02-06T12:00:00Z');
    const fiveHoursAgo = new Date('2026-02-06T07:00:00Z');
    expect(formatAge(fiveHoursAgo.toISOString(), now)).toBe('5h');
  });

  it('should format age in minutes for < 60 minutes', () => {
    const now = new Date('2026-02-06T12:00:00Z');
    const threeMinutesAgo = new Date('2026-02-06T11:57:00Z');
    expect(formatAge(threeMinutesAgo.toISOString(), now)).toBe('3m');
  });

  it('should show <1m for very recent timestamps', () => {
    const now = new Date('2026-02-06T12:00:00Z');
    const justNow = new Date('2026-02-06T11:59:45Z');
    expect(formatAge(justNow.toISOString(), now)).toBe('<1m');
  });

  it('should use current time when now is not provided', () => {
    const veryOld = new Date('2020-01-01T00:00:00Z');
    const result = formatAge(veryOld.toISOString());
    expect(result).toMatch(/^\d+d$/);
  });
});
