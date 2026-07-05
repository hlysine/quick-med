import { Plugin } from 'vite';
import path from 'path';
import fg from 'fast-glob';
import fm from 'front-matter';

export interface Config {
  entries: {
    folderPath: string;
    output: string;
  }[];
}

interface FrontMatter {
  title: string;
  section: string;
  keywords: string[];
  patterns: string[];
}

interface OutputEntry extends FrontMatter {
  key: string;
}

function stripExtension(path: string) {
  return path.split('.').slice(0, -1).join('.');
}

function parseFrontMatter(markdown: string): FrontMatter | undefined {
  const { attributes } = fm<FrontMatter>(markdown);
  if (
    !attributes ||
    typeof attributes !== 'object' ||
    !(typeof attributes.title === 'string') ||
    !(typeof attributes.section === 'string') ||
    (attributes.keywords && !Array.isArray(attributes.keywords)) ||
    (attributes.patterns && !Array.isArray(attributes.patterns))
  ) {
    console.warn('⚠️  Invalid or missing frontmatter in markdown file.');
    return undefined;
  }
  attributes.keywords = attributes.keywords ?? [];
  attributes.patterns = attributes.patterns ?? [];
  return attributes;
}

async function generateIndex(config: Config) {
  console.log('♻️  Generating indices...');
  const now = performance.now();

  for (const entry of config.entries) {
    const entries: OutputEntry[] = [];
    const files = await fg('**/*.md', {
      cwd: entry.folderPath,
    });
    files.sort();
    for (const file of files) {
      const markdown = await Bun.file(
        path.resolve(entry.folderPath, file)
      ).text();

      const key = stripExtension(file);

      const frontMatter = parseFrontMatter(markdown);
      if (!frontMatter) {
        console.warn(`⚠️  No front matter found in ${file}. Skipping...`);
        continue;
      }
      entries.push({
        ...frontMatter,
        key,
      });
    }
    entries.sort((a, b) => a.section.localeCompare(b.section));

    await Bun.write(
      path.resolve(process.cwd(), entry.output),
      JSON.stringify(entries, null, 2)
    );
  }

  console.log(
    '✅ Indices generated in',
    Math.round(performance.now() - now),
    'ms'
  );
}

let lock = false;

export function markdownIndex(config: Config): Plugin {
  const ROOT: string = process.cwd();

  const generate = async () => {
    if (lock) {
      return;
    }
    lock = true;
    try {
      await generateIndex(config);
    } catch (err) {
      console.error(err);
      console.info();
    }
    lock = false;
  };

  const handleFile = async (
    file: string,
    event: 'create' | 'update' | 'delete'
  ) => {
    const filePath = path.normalize(file);

    if (
      event === 'update' &&
      config.entries.map(e => path.resolve(ROOT, e.output)).includes(filePath)
    ) {
      // skip generating routes if the generated file is updated
      return;
    }

    const sourcePaths = config.entries.map(e => path.join(ROOT, e.folderPath));
    const scriptsPath = path.join(ROOT, 'scripts');

    if (
      sourcePaths.some(p => filePath.startsWith(p)) ||
      filePath.startsWith(scriptsPath)
    ) {
      await generate();
    }
  };

  return {
    name: 'vite-plugin-extremely-basic-markdown-index-generator',
    configResolved: async () => {
      await generate();
    },
    watchChange: async (file, context) => {
      if (['create', 'update', 'delete'].includes(context.event)) {
        await handleFile(file, context.event);
      }
    },
  };
}
