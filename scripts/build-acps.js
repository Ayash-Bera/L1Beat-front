#!/usr/bin/env node

// scripts/build-acps.js
// Build script to process ACP submodule and generate JSON data

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACPS_DIR = path.join(__dirname, "../public/acps/ACPs");
const OUTPUT_DIR = path.join(__dirname, "../public/acps");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "processed-acps.json");

class ACPBuilder {
  constructor() {
    this.acps = [];
    this.stats = {
      total: 0,
      byStatus: {},
      byTrack: {},
      byComplexity: {},
    };
  }

  async build() {
    console.log("🚀 Building ACP data from submodule...");

    try {
      // Ensure output directory exists
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      // Check if ACPs directory exists
      if (!fs.existsSync(ACPS_DIR)) {
        console.error(`❌ ACPs directory not found at ${ACPS_DIR}`);
        console.log("🔧 Make sure the submodule is initialized:");
        console.log(
          "   git submodule add https://github.com/avalanche-foundation/ACPs.git public/acps"
        );
        console.log("   git submodule update --init --recursive");
        process.exit(1);
      }

      // Read all ACP folders
      const folders = fs.readdirSync(ACPS_DIR).filter((name) => {
        const fullPath = path.join(ACPS_DIR, name);
        return fs.statSync(fullPath).isDirectory() && /^\d+-/.test(name);
      });

      console.log(`📁 Found ${folders.length} ACP folders`);

      if (folders.length === 0) {
        console.warn(
          "⚠️  No ACP folders found. Check if submodule is properly initialized."
        );
        console.log("Try running: git submodule update --init --recursive");
        process.exit(1);
      }

      // Process each ACP folder
      for (const folderName of folders) {
        try {
          const acp = await this.processACPFolder(folderName);
          if (acp) {
            this.acps.push(acp);
            console.log(`✅ Processed ACP-${acp.number}: ${acp.title}`);
          }
        }
 catch (error) {
          console.warn(`⚠️  Failed to process ${folderName}:`, error.message);
        }
      }

      // Calculate statistics
      this.calculateStats();

      // Write processed data
      const output = {
        acps: this.acps,
        stats: this.stats,
        lastUpdated: new Date().toISOString(),
        totalProcessed: this.acps.length,
      };

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
      console.log(`✅ Successfully processed ${this.acps.length} ACPs`);
      console.log(`📄 Data written to: ${OUTPUT_FILE}`);

      // Create index file for easier access
      const indexFile = path.join(OUTPUT_DIR, "index.json");
      const indexData = {
        folders: folders,
        totalACPs: this.acps.length,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2));

      console.log("🎉 Build completed successfully!");
    }
 catch (error) {
      console.error("❌ Build failed:", error);
      process.exit(1);
    }
  }

  async processACPFolder(folderName) {
    const folderPath = path.join(ACPS_DIR, folderName);
    const readmePath = path.join(folderPath, "README.md");

    if (!fs.existsSync(readmePath)) {
      throw new Error(`README.md not found in ${folderName}`);
    }

    // Extract ACP number from folder name
    const match = folderName.match(/^(\d+)-/);
    if (!match) {
      throw new Error(`Invalid folder name format: ${folderName}`);
    }

    const number = match[1];
    const content = fs.readFileSync(readmePath, "utf-8");

    return this.parseACPMarkdown(content, number, folderName);
  }

  parseACPMarkdown(markdown, acpNumber, folderName) {
    try {
      const lines = markdown.split("\n");
      let title = "";
      let authors = [];
      let status = "";
      let track = "";
      let discussion = "";
      let inTable = false;
      let abstract = "";
      let afterTable = false;

      // Parse the ACP metadata table and content
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) continue;

        // Detect table start
        if (line.startsWith("| ACP |") || line.includes("| **ACP** |")) {
          inTable = true;
          continue;
        }

        // Detect table end (next heading)
        if (inTable && line.startsWith("#")) {
          afterTable = true;
          inTable = false;

          // Extract abstract from first meaningful paragraph after table
          if (!abstract && line.startsWith("## Abstract")) {
            let j = i + 1;
            while (j < lines.length) {
              const abstractLine = lines[j].trim();
              if (!abstractLine) {
                j++;
                continue;
              }
              if (abstractLine.startsWith("#")) break;
              if (abstractLine.length > 50) {
                abstract = abstractLine.substring(0, 200);
                if (abstract.length === 200) abstract += "...";
                break;
              }
              j++;
            }
          }
          continue;
        }

        // Parse table rows
        if (inTable && line.startsWith("|")) {
          if (line.includes("| **Title** |")) {
            title = this.extractTableValue(line, "Title");
          }
 else if (line.includes("| **Author(s)** |") || line.includes("| **Authors** |")) {
            const authorsStr = this.extractTableValue(line, "Authors");
            authors = this.parseAuthors(authorsStr);
          }
 else if (line.includes("| **Status** |")) {
            status = this.extractTableValue(line, "Status");
          }
 else if (line.includes("| **Track** |")) {
            track = this.extractTableValue(line, "Track");
          }
 else if (
            line.includes("| **Discussions** |") ||
            line.includes("| **Discussion** |")
          ) {
            const discussionStr = this.extractTableValue(line, "Discussion");
            discussion = this.extractDiscussionUrl(discussionStr);
          }
        }
      }

      // If no abstract found in Abstract section, try to find first meaningful paragraph
      if (!abstract) {
        abstract = this.extractAbstractFromContent(markdown);
      }

      // Calculate complexity based on content length and keywords
      const complexity = this.calculateComplexity(markdown);

      // Extract tags from content
      const tags = this.extractTags(markdown, title);

      return {
        number: acpNumber,
        title: title || `ACP-${acpNumber}`,
        authors:
          authors.length > 0 ? authors : [{ name: "Unknown", github: "" }],
        status: status || "Unknown",
        track: track || "Unknown",
        discussion: discussion || "",
        content: markdown,
        folderName: folderName,
        abstract: abstract || "No abstract available.",
        complexity: complexity,
        tags: tags,
        readingTime: Math.max(1, Math.ceil(markdown.length / 1000)),
      };
    }
 catch (error) {
      console.warn(`Failed to parse ACP-${acpNumber}:`, error.message);
      return null;
    }
  }

  extractTableValue(line, fieldName) {
    // Extract value from table row like "| **Field** | Value |"
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 3) {
      const field = parts[1].replace(/\*\*/g, "").trim();
      if (field.toLowerCase().startsWith(fieldName.toLowerCase().substring(0,5))) {
        return parts[2].replace(/\*\*/g, "").trim();
      }
    }
    return "";
  }

  parseAuthors(authorsStr) {
    if (!authorsStr) return [];

    const authors = [];
    const authorParts = authorsStr.split(/,\s*(?![^\[\]]*\])/g).map((a) => a.trim());

    for (const authorPart of authorParts) {
      const githubMatch = authorPart.match(/(.+?)\s*\(@(.+?)\)/);
      const linkMatch = authorPart.match(/\[(.+?)\]\((.+?)\)/);

      if (githubMatch) {
        authors.push({
          name: githubMatch[1].trim(),
          github: githubMatch[2].trim(),
        });
      }
 else if (linkMatch) {
        const name = linkMatch[1].trim();
        const link = linkMatch[2].trim();
        let github = "";
        if (link.includes("github.com")) {
          github = link.split("/").pop() || "";
        }
        authors.push({ name, github });
      }
 else {
        authors.push({ name: authorPart, github: "" });
      }
    }
    return authors;
  }

  extractDiscussionUrl(discussionStr) {
    if (!discussionStr) return "";

    // Extract URL from markdown link [text](url)
    const urlMatch = discussionStr.match(/\(([^)]+)\)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // If it's already a URL
    if (discussionStr.startsWith("http")) {
      return discussionStr;
    }

    return "";
  }

  extractAbstractFromContent(markdown) {
    const lines = markdown.split("\n");
    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip tables
      if (trimmed.startsWith("|")) {
        inTable = true;
        continue;
      }

      if (inTable && trimmed.startsWith("#")) {
        inTable = false;
        continue;
      }

      // Find first substantial paragraph that's not a header or table
      if (!inTable && !trimmed.startsWith("#") && trimmed.length > 50) {
        let abstract = trimmed.substring(0, 200);
        if (abstract.length === 200) abstract += "...";
        return abstract;
      }
    }

    return "No abstract available.";
  }

  calculateComplexity(content) {
    const length = content.length;
    const complexTerms = [
      "implementation",
      "algorithm",
      "cryptographic",
      "consensus",
      "protocol",
      "specification",
      "technical",
      "architecture",
    ];

    const hasComplexTerms = complexTerms.some((term) =>
      content.toLowerCase().includes(term)
    );

    if (length > 10000 || hasComplexTerms) return "High";
    if (length > 5000) return "Medium";
    return "Low";
  }

  extractTags(content, title) {
    const tags = [];
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Common ACP categories/tags
    const tagKeywords = {
      consensus: ["consensus", "validator", "staking"],
      networking: ["network", "p2p", "communication"],
      economics: ["fee", "economic", "incentive", "reward"],
      governance: ["governance", "voting", "proposal"],
      security: ["security", "cryptographic", "signature"],
      performance: ["performance", "optimization", "efficiency"],
      interoperability: ["interop", "bridge", "cross-chain"],
      vm: ["virtual machine", "vm", "execution"],
      api: ["api", "interface", "endpoint"],
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (
        keywords.some(
          (keyword) =>
            lowerContent.includes(keyword) || lowerTitle.includes(keyword)
        )
      ) {
        tags.push(tag);
      }
    }

    return tags;
  }

  calculateStats() {
    this.stats.total = this.acps.length;

    this.acps.forEach((acp) => {
      // Count by status
      const status = acp.status || "Unknown";
      this.stats.byStatus[status] = (this.stats.byStatus[status] || 0) + 1;

      // Count by track
      const track = acp.track || "Unknown";
      this.stats.byTrack[track] = (this.stats.byTrack[track] || 0) + 1;

      // Count by complexity
      const complexity = acp.complexity || "Medium";
      this.stats.byComplexity[complexity] =
        (this.stats.byComplexity[complexity] || 0) + 1;
    });
  }
}

// Run the builder
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new ACPBuilder();
  await builder.build();
}
