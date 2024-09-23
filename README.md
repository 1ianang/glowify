# Glowify

Glowify is a Chrome extension that allows you to highlight text on a webpage and add comments to those highlights.

## Features

- **Highlight Text:** Easily highlight selected text on any webpage.
- **Add Comments:** Attach comments to your highlights for better context.
- **Sync with Notion:** Save and manage your highlights directly in Notion.
- **Side Panel View:** Access all your highlights conveniently from a side panel.

## Installation

Follow these steps to install Glowify in your Chromium-based browser:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/joshualeung/glowify.git
   ```
2. **Open Chrome Extensions Page:**
   Navigate to `chrome://extensions` in your Chrome browser.

3. **Enable Developer Mode:**
   Toggle the "Developer mode" switch located in the top right corner.

4. **Load Unpacked Extension:**
   Click on the "Load unpacked" button and select the cloned repository folder.

## Getting Started

### Highlighting and Commenting

#### 1. Highlight Mode
   Select any text to display the Glowify toolbar. Note that the toolbar will not appear if the selected text is too short (less than 3 words) or it spans multiple paragraphs.
   
Buttons available in Highlight Mode:
   - **Highlight:** Apply a highlight to the selected text.
   - **Comment:** Add a comment to the highlight.
   - **Copy:** Copy the selected text to your clipboard.
   - **Disable:** Don't show Glowify toolbar and highlights on this website.

#### 2. Edit Mode:
Hovering over a highlighted text will display the EDIT mode toolbar.

Buttons available in Edit Mode:
   - **Comment:** Add or update the comment associated with the highlight.
   - **Delete:** Remove the highlight from the text.
   - **Change Color:** Alter the highlight color to your preference. Currently, custom color is not saved which means you get the original highlight color after refreshing the page.
   - **Disable:** Don't show Glowify toolbar and highlights on this website.

### Glowify Side Panel

1. **Open Side Panel:**
   Click the "Glowify" icon in the Chrome toolbar to open the side panel.
   
2. **Manage Highlights:**
   - **View Highlights:** See all highlights on the current tab. 
      - Click the highlight and the web page will scroll to the corresponding position.
      - Click the "x" icon to delete the highlight.
   - **Settings:** Switch to the "Settings" tab to customize your preferences.

## Syncing with Notion

To synchronize your highlights with Notion, you'll need a Notion account and an integration set up.

### Steps to Sync:

1. **Create Notion Integration:**
   - Visit [Notion Integrations](https://www.notion.so/my-integrations).
   - Click on "Create new integration" and obtain your API key.

2. **Set Up Notion Database:**
   - **Option 1:** Manually create a database with the following properties:
     - `excerpt` (Title)
     - `pageUrl` (URL)
     - `highlightId` (Rich Text)
     - `pageTitle` (Rich Text)
     - `comment` (Rich Text)
     - `created` (Date)
     - `updated` (Date)
     - `startContainer` (Rich Text)
     - `startOffset` (Rich Text)
     - `endContainer` (Rich Text)
     - `endOffset` (Rich Text)
   - **Option 2:** [Recommended] Clone the [Glowify Notion Database Template](https://www.notion.so/ce34483fe9d048a380d850d682fae25d?v=fff36e411feb814b8b80000c46bb500a).

3. **Configure Glowify:**
   - Navigate to the Glowify options page.
   - Enter your Notion Database ID and API key.
   - Click "Save" to finalize the setup.

## Support

If you encounter any issues or have questions, feel free to [open an issue](https://github.com/joshualeung/glowify/issues) on GitHub or drop me an email at [lcm.hust@gmail.com](mailto:lcm.hust@gmail.com).

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- Inspired by various Chrome extensions for enhanced web interaction.
- Thanks to the open-source community for their invaluable contributions.
