import { PROJECTS } from './projects';

describe('PROJECTS', () => {
  it('has enough entries to exercise the wrapping carousel', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(3);
  });

  it('gives every project a non-empty title, description, date and url', () => {
    for (const project of PROJECTS) {
      expect(project.title.trim()).not.toBe('');
      expect(project.description.trim()).not.toBe('');
      expect(project.date.trim()).not.toBe('');
      expect(project.url.trim()).not.toBe('');
    }
  });

  it('uses absolute http(s) urls, since the View button opens them in a new tab', () => {
    for (const project of PROJECTS) {
      expect(project.url).toMatch(/^https?:\/\//);
    }
  });

  it('keeps descriptions short enough for the card to render ~3 lines', () => {
    for (const project of PROJECTS) {
      expect(project.description.length).toBeLessThanOrEqual(140);
    }
  });
});

describe('PROJECTS card fields', () => {
  it('gives every project a role and at least one stack chip', () => {
    for (const project of PROJECTS) {
      expect(project.role.trim().length).toBeGreaterThan(0);
      expect(project.stack.length).toBeGreaterThan(0);
      for (const chip of project.stack) expect(chip.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps stack chips short enough to sit on one line of the card', () => {
    for (const project of PROJECTS) {
      expect(project.stack.length).toBeLessThanOrEqual(4);
      for (const chip of project.stack) expect(chip.length).toBeLessThanOrEqual(14);
    }
  });
});
