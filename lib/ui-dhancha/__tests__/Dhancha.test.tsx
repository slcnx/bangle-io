import { act, fireEvent, render } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

import { MultiColumnMainContent } from '..';
import { Dhancha } from '../Dhancha';

test('renders', () => {
  let result = render(
    <div>
      <Dhancha
        widescreen={true}
        activitybar={<div>Activitybar</div>}
        mainContent={<div>Main content</div>}
        noteSidebar={<div>Note sidebar</div>}
        workspaceSidebar={<div>Workspace sidebar</div>}
      />
    </div>,
  );

  expect(result.container.innerHTML).toContain('Activitybar');
  expect(result.container.innerHTML).toContain('Note sidebar');
  expect(result.container.innerHTML).toContain('Main content');
  expect(result.container.innerHTML).toContain('Workspace sidebar');

  expect(result.container).toMatchSnapshot();
});

test('renders when widescreen=false', () => {
  let result = render(
    <div>
      <Dhancha
        widescreen={false}
        activitybar={<div>Activitybar</div>}
        mainContent={<div>Main content</div>}
        noteSidebar={<div>Note sidebar</div>}
        workspaceSidebar={<div>Workspace sidebar</div>}
      />
    </div>,
  );

  expect(result.container.innerHTML).toContain('Activitybar');
  expect(result.container.innerHTML).not.toContain('Note sidebar');
  expect(result.container.innerHTML).toContain('Main content');
  expect(result.container.innerHTML).not.toContain('Workspace sidebar');

  expect(result.container).toMatchSnapshot();
});

describe('MultiColumnMainContent', () => {
  test('renders', () => {
    let result = render(
      <div>
        <MultiColumnMainContent>Hello</MultiColumnMainContent>
      </div>,
    );

    expect(result.container).toMatchSnapshot();
  });
});
