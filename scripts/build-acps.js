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
        process.exit(1);
      }

      // Process each folder
      for (const folderName of folders) {
        const acp = await this.processACPFolder(folderName);
        if (acp) {
          this.acps.push(acp);
        }
      }

      // Sort by number (newest first)
      this.acps.sort((a, b) => Number(b.number) - Number(a.number));

      // Calculate statistics
      this.calculateStats();

      // Generate output
      const output = {
        acps: this.acps,
        stats: this.stats,
        generatedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      // Write to file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

      // Also create an index file for development fallback
      this.createIndex(folders);

      console.log(`✅ Successfully processed ${this.acps.length} ACPs`);
      console.log(`📊 Statistics:`);
      console.log(`   - Total: ${this.stats.total}`);
      console.log(`   - By Status:`, this.stats.byStatus);
      console.log(`   - By Track:`, this.stats.byTrack);
      console.log(`   - By Complexity:`, this.stats.byComplexity);
      console.log(`💾 Output written to: ${OUTPUT_FILE}`);
    } catch (error) {
      console.error("❌ Error building ACP data:", error);
      process.exit(1);
    }
  }

  async processACPFolder(folderName) {
    const match = folderName.match(/^(\d+)-/);
    if (!match) return null;

    const number = match[1];
    const readmePath = path.join(ACPS_DIR, folderName, "README.md");

    try {
      if (!fs.existsSync(readmePath)) {
        console.warn(`⚠️  No README.md found for ACP-${number}`);
        return null;
      }

      const content = fs.readFileSync(readmePath, "utf-8");
      const acp = this.parseACPMarkdown(content, number, folderName);

      if (acp) {
        console.log(`✓ Processed ACP-${number}: ${acp.title}`);
      }

      return acp;
    } catch (error) {
      console.error(`❌ Error processing ACP-${number}:`, error.message);
      return null;
    }
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

      // Enhanced parsing for dependencies and relationships
      let dependencies = [];
      let replaces = [];
      let supersededBy = [];

      // Extract abstract (first paragraph after table)
      let abstract = "";
      let afterTable = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!line.trim()) continue;

        if (line.startsWith("| ACP |")) {
          inTable = true;
          continue;
        }

        if (inTable && line.startsWith("##")) {
          afterTable = true;
          inTable = false;
          continue;
        }

        if (inTable) {
          if (line.includes("| **Title** |")) {
            title = line.split("|")[2].trim();
          } else if (line.includes("| **Author(s)** |")) {
            const authorText = line.split("|")[2];
            authors = this.parseAuthors(authorText);
          } else if (line.includes("| **Status** |")) {
            const statusText = line.split("|")[2];
            status = this.parseStatus(statusText);
            discussion = this.parseDiscussionLink(statusText);
          } else if (line.includes("| **Track** |")) {
            track = line.split("|")[2].trim();
          } else if (
            line.includes("| **Depends** |") ||
            line.includes("| **Dependencies** |")
          ) {
            dependencies = this.parseRelationships(line.split("|")[2]);
          } else if (line.includes("| **Replaces** |")) {
            replaces = this.parseRelationships(line.split("|")[2]);
          } else if (line.includes("| **Superseded-By** |")) {
            supersededBy = this.parseRelationships(line.split("|")[2]);
          }
        }

        // Get abstract from first substantial paragraph after table
        if (
          afterTable &&
          !abstract &&
          line.trim() &&
          !line.startsWith("#") &&
          !line.startsWith("|")
        ) {
          abstract = line.trim();
          if (abstract.length > 200) {
            abstract = abstract.substring(0, 200) + "...";
          }
        }
      }

      // Calculate reading time (rough estimate)
      const wordCount = markdown.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

      // Extract potential tags from title and content
      const tags = this.extractTags(title, markdown);

      // Determine complexity based on content
      const complexity = this.determineComplexity(markdown);

      return {
        number: acpNumber,
        title,
        authors,
        status,
        track,
        content: markdown,
        discussion,
        abstract,
        readingTime,
        tags,
        complexity,
        dependencies,
        replaces,
        supersededBy,
        folderName,
      };
    } catch (err) {
      console.error(`Error parsing ACP-${acpNumber}:`, err);
      return null;
    }
  }

  parseAuthors(text) {
    const authors = [];
    const matches = text.match(/([^(@\n]+)(?:\s*\([@]([^)]+)\))?/g);

    if (matches) {
      matches.forEach((match) => {
        const [_, name, github] =
          match.match(/([^(@\n]+)(?:\s*\([@]([^)]+)\))?/) || [];
        if (name) {
          authors.push({
            name: name.trim(),
            github: github?.trim() || name.trim(),
          });
        }
      });
    }

    return authors;
  }

  parseStatus(text) {
    const statusMatch = text.match(/\[([^\]]+)\]|\b(\w+)\b/);
    return (statusMatch?.[1] || statusMatch?.[2] || "Unknown").trim();
  }

  parseDiscussionLink(text) {
    const match = text.match(/\[Discussion\]\(([^)]+)\)/);
    return match ? match[1] : undefined;
  }

  parseRelationships(text) {
    const relationships = [];
    const matches = text.match(/ACP-(\d+)/g);
    if (matches) {
      matches.forEach((match) => {
        const number = match.replace("ACP-", "");
        if (number) relationships.push(number);
      });
    }
    return relationships;
  }

  extractTags(title, content) {
    const tags = [];
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Common ACP topics
    if (titleLower.includes("consensus") || contentLower.includes("consensus"))
      tags.push("Consensus");
    if (titleLower.includes("validator") || contentLower.includes("validator"))
      tags.push("Validators");
    if (titleLower.includes("staking") || contentLower.includes("staking"))
      tags.push("Staking");
    if (titleLower.includes("network") || contentLower.includes("network"))
      tags.push("Network");
    if (titleLower.includes("upgrade") || contentLower.includes("upgrade"))
      tags.push("Upgrade");
    if (titleLower.includes("fee") || contentLower.includes("fee"))
      tags.push("Fees");
    if (titleLower.includes("subnet") || contentLower.includes("subnet"))
      tags.push("Subnets");

    return tags.slice(0, 3); // Limit to 3 tags
  }

  determineComplexity(content) {
    const wordCount = content.split(/\s+/).length;
    const technicalTerms = (
      content.match(
        /\b(implementation|algorithm|protocol|consensus|merkle|hash|signature|cryptograph|byzantine)\b/gi
      ) || []
    ).length;

    if (wordCount > 3000 || technicalTerms > 20) return "High";
    if (wordCount > 1500 || technicalTerms > 10) return "Medium";
    return "Low";
  }

  calculateStats() {
    this.stats.total = this.acps.length;

    this.acps.forEach((acp) => {
      // Status
      this.stats.byStatus[acp.status] =
        (this.stats.byStatus[acp.status] || 0) + 1;

      // Track
      this.stats.byTrack[acp.track] = (this.stats.byTrack[acp.track] || 0) + 1;

      // Complexity
      if (acp.complexity) {
        this.stats.byComplexity[acp.complexity] =
          (this.stats.byComplexity[acp.complexity] || 0) + 1;
      }
    });
  }

  createIndex(folders) {
    const indexPath = path.join(OUTPUT_DIR, "ACPs", "index.json");
    const indexDir = path.dirname(indexPath);

    if (!fs.existsSync(indexDir)) {
      fs.mkdirSync(indexDir, { recursive: true });
    }

    const index = {
      folders: folders,
      generatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`📄 Created index file at: ${indexPath}`);
  }
}
// Run the builder
const builder = new ACPBuilder();
builder.build().catch(console.error);
