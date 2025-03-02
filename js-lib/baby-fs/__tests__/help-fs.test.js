import { HelpFileSystem } from '../help-fs';

let mockStore = new Map();
let mockMetaStore = new Map();

const getLast = (array) => array[array.length - 1];

const toFile = (str) => {
  var file = new File(str, 'foo.txt', { type: 'text/plain' });
  return file;
};

jest.mock('idb-keyval', () => {
  const idb = {};
  const dbSuffix = 3;

  idb.createStore = (dbName) => {
    return dbName;
  };

  const getStore = (args) => {
    if (getLast(args) === `baby-idb-meta-${dbSuffix}`) {
      return mockMetaStore;
    } else {
      return mockStore;
    }
  };

  idb.get = jest.fn(async (...args) => {
    return getStore(args).get(...args);
  });
  idb.del = jest.fn(async (...args) => {
    return getStore(args).delete(...args);
  });
  idb.set = jest.fn(async (...args) => {
    return getStore(args).set(...args);
  });
  idb.keys = jest.fn(async (...args) => {
    return Array.from(getStore(args).keys(...args));
  });
  return idb;
});
const originalFile = window.File;

beforeEach(() => {
  mockStore?.clear();
  mockMetaStore?.clear();
  window.fetch = undefined;
  window.File = class File {
    constructor(content, fileName, opts) {
      this.content = content;
      this.fileName = fileName;
      this.opts = opts;
    }
    async text() {
      return this.content;
    }
  };
});

afterEach(() => {
  window.File = originalFile;
});

test('readFileAsText', async () => {
  const filePath = 'hola/hi.md';
  const fileContent = 'i am a content';

  const readFile = jest.fn(async () => {
    return toFile(fileContent);
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });

  const data = await fs.readFileAsText(filePath);

  expect(data).toMatchInlineSnapshot(`"i am a content"`);

  expect(readFile).toHaveBeenCalledTimes(1);
  expect(readFile).nthCalledWith(1, 'hola/hi.md');
});

test('readFile', async () => {
  const filePath = 'hola/hi.md';
  const fileContent = 'i am a content';

  const readFile = jest.fn(async () => {
    return toFile(fileContent);
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });

  const data = await fs.readFile(filePath);

  expect(readFile).toHaveBeenCalledTimes(1);

  expect(data).toMatchInlineSnapshot(`
    File {
      "content": "i am a content",
      "fileName": "foo.txt",
      "opts": Object {
        "type": "text/plain",
      },
    }
  `);
});

test('readFile from local by default', async () => {
  const filePath = 'hola/hi.md';
  const fileContent = 'i am a content';

  const readFile = jest.fn(async () => {
    return toFile(fileContent);
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: true,
    listFiles,
  });

  await fs.writeFile(filePath, toFile('my-data'));

  await fs.readFile(filePath);

  expect(readFile).toHaveBeenCalledTimes(0);
});

test('when opts.readFile returns null should throw not found error', async () => {
  const filePath = 'hola/hi.md';

  const readFile = jest.fn(async () => {
    return null;
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });

  await expect(
    fs.readFile(filePath),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"BABY_FS_FILE_NOT_FOUND_ERROR:File hola/hi.md not found"`,
  );
  expect(readFile).toHaveBeenCalledTimes(1);
});

test('writeFile works by default', async () => {
  const filePath = 'hola/hi.md';

  const readFile = jest.fn(async () => {
    return null;
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    listFiles,
  });

  await fs.writeFile(filePath, toFile('my-data'));
  expect(mockStore).toMatchInlineSnapshot(`
    Map {
      "hola/hi.md" => File {
        "content": "my-data",
        "fileName": "foo.txt",
        "opts": Object {
          "type": "text/plain",
        },
      },
    }
  `);
  expect(readFile).toHaveBeenCalledTimes(0);
});

test('writeFile throws error when fallback is disabled', async () => {
  const filePath = 'hola/hi.md';

  const readFile = jest.fn(async () => {
    return null;
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });

  await expect(
    fs.writeFile(filePath, toFile('my-data')),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"BABY_FS_NOT_ALLOWED_ERROR:Writing not allowed"`,
  );
});

test("listFile fallback is disabled doesn't return local files", async () => {
  const readFile = jest.fn(async () => {
    return;
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md', 'hi2.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });
  const fsLocal = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: true,
    listFiles,
  });

  await fsLocal.writeFile('hola/local-hi.md', toFile('my-data'));

  await expect(fs.opendirRecursive('hola')).resolves.toMatchInlineSnapshot(`
          Array [
            "hola/hi.md",
            "hola/hi2.md",
          ]
        `);
  await expect(fsLocal.opendirRecursive('hola')).resolves
    .toMatchInlineSnapshot(`
          Array [
            "hola/hi.md",
            "hola/hi2.md",
            "hola/local-hi.md",
          ]
        `);

  expect(listFiles).toHaveBeenCalledTimes(2);
  expect(listFiles).nthCalledWith(1, 'hola');
  expect(listFiles).nthCalledWith(2, 'hola');
});

test('readFile fallback local override', async () => {
  const readFile = jest.fn(async () => {
    return toFile('original content');
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md', 'hi2.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });
  const fsLocal = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: true,
    listFiles,
  });

  await fsLocal.writeFile('hola/hi.md', toFile('local override'));

  expect(await fs.readFileAsText('hola/hi.md')).toMatchInlineSnapshot(
    `"original content"`,
  );

  expect(await fsLocal.readFileAsText('hola/hi.md')).toMatchInlineSnapshot(
    `"local override"`,
  );
});

test('stat', async () => {
  const readFile = jest.fn(async () => {
    return toFile('original content');
  });
  const listFiles = jest.fn(async () => {
    return ['hi.md', 'hi2.md'];
  });
  const fs = new HelpFileSystem({
    helpDocsVersion: '1.0.1',
    readFile,
    allowLocalChanges: false,
    listFiles,
  });
  const data = await fs.stat('hola/hi');
  expect(data).toEqual({
    mtimeMs: expect.any(Number),
  });
});
