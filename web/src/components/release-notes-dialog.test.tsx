import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReleaseNotesDialog, ReleaseNotesButton } from './release-notes-dialog';

describe('ReleaseNotesDialog', () => {
  it('should render dialog when open is true', () => {
    render(
      <ReleaseNotesDialog open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByText('Release Notes')).toBeInTheDocument();
  });

  it('should not render content when open is false', () => {
    render(
      <ReleaseNotesDialog open={false} onOpenChange={() => {}} />
    );
    expect(screen.queryByText('Release Notes')).not.toBeInTheDocument();
  });

  it('should display version and date', () => {
    render(
      <ReleaseNotesDialog open={true} onOpenChange={() => {}} />
    );
    // Should show at least version 1.0.0
    expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
  });

  it('should display change types with labels', () => {
    render(
      <ReleaseNotesDialog open={true} onOpenChange={() => {}} />
    );
    // Should show Chinese labels (multiple items have 新功能)
    const featureLabels = screen.getAllByText('新功能');
    expect(featureLabels.length).toBeGreaterThan(0);
  });

  it('should show edit mode button for admin', () => {
    render(
      <ReleaseNotesDialog open={true} onOpenChange={() => {}} isAdmin={true} />
    );
    expect(screen.getByText('編輯')).toBeInTheDocument();
  });

  it('should hide edit mode button for non-admin', () => {
    render(
      <ReleaseNotesDialog open={true} onOpenChange={() => {}} isAdmin={false} />
    );
    expect(screen.queryByText('編輯')).not.toBeInTheDocument();
  });

  it('should toggle edit mode when clicking edit button', async () => {
    const user = userEvent.setup();
    render(
      <ReleaseNotesDialog open={true} onOpenChange={() => {}} isAdmin={true} />
    );

    await user.click(screen.getByText('編輯'));
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('版本號 (如: 1.1.0)')).toBeInTheDocument();
  });
});

describe('ReleaseNotesButton', () => {
  it('should render button with icon', () => {
    render(<ReleaseNotesButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should open dialog when clicked', async () => {
    const user = userEvent.setup();
    render(<ReleaseNotesButton />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Release Notes')).toBeInTheDocument();
  });

  it('should show version badge', () => {
    render(<ReleaseNotesButton />);
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
  });
});
