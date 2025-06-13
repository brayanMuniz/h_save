# h_save

This project is a personal media server designed specifically for doujinshi collections. It provides a clean, modern interface for browsing, filtering, and interacting with your library.

## Key Features

*   **Library Browsing:** View your collection in two distinct modes: a compact `Cover` view for quick visual scanning and a detailed `Card` view for more information at a glance.
*   **Advanced Filtering & Sorting:**
    *   Filter your library with precise, multi-faceted rules.
    *   Filter by rating, o-count, page count, and "in-progress" status.
    *   Sort results by date, title, rating, or a random shuffle to rediscover old favorites.
*   **Saved Filters:** Save complex filter combinations with a custom name for easy one-click access later.
*   **Abstracted Entity Pages:** A consistent and unified experience for viewing all works by a specific **Artist**, **Tag**, **Group**, **Character**, or **Parody**.
*   **Interactive UI:**
    *   Toggle favorites for any entity with instant, optimistic UI feedback.
    *   Rate works with a simple, interactive star system.
    *   Edit bookmark names directly from the doujinshi overview page.
*   **Library Synchronization:**
    *   Automatically sync your library to link database entries with downloaded folders.
    *   A robust manual sync interface for entries that could not be matched automatically, complete with thumbnail previews for confident matching.
*   **External Provider Integration:** Authenticate with external sources (e.g., nhentai) to download your favorites and their metadata directly into the library.
*   **Responsive Design:** A clean, adaptive layout with a dedicated mobile filter bar for a seamless experience on smaller devices.

## Tech Stack

*   **Backend:** **Go** with the **Gin** web framework.
*   **Database:** **SQLite3** for simple, file-based storage.
*   **Frontend:** **React** with **TypeScript** and **Vite**.

## Getting Started

Follow these instructions to get a local copy up and running for development.

### Prerequisites

*   [Go](https://go.dev/doc/install) (version 1.18 or newer)
*   [Node.js](https://nodejs.org/en/) (version 16 or newer)

### Installation & Setup

1.  **Clone the Repository**
    ```sh
    git clone https://github.com/brayanMuniz/h_save.git
    cd h_save
    ```

2.  **Create Required Folders**
    *   In the root of the project, create two folders:
        1.  `doujinshi`: This is where your collection's content (folders for each entry) will be stored.
        2.  `download_me_senpai`: This is the destination for downloaded torrent files from external providers.

3.  **Backend Setup**
    ```sh
    # Navigate to the backend directory
    cd backend 

    # Install dependencies
    go mod tidy

    # Run the server. The database and tables will be created on the first run.
    go run main.go
    ```
    The backend server will start, typically on port `8080`.

4.  **Frontend Setup**
    ```sh
    # From the root directory, navigate to the frontend directory
    cd ui

    # Install dependencies
    npm install

    # Run the development server
    npm run dev
    ```
    The frontend will start, typically on port `5173`, and will proxy API requests to the backend.

## Workflow: From Favorites to Library

This application is designed to bridge the gap between your nhentai favorites and a locally-hosted, organized library. Here is the typical workflow to get your collection set up:

1.  **Get Your nhentai Credentials**
    *   Navigate to the **Settings** page in the application and select the **nhentai** provider from the sidebar.
    *   You will need to provide two values from your browser after logging into nhentai: your `Session ID` and `CSRF Token`.
    *   An easy way to get these values is by using a browser extension that can view cookies for the current site.
    *   **Recommended Tool:** [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) for Chrome/Brave. After installing, log in to nhentai, click the extension icon, and it will show you the values for `sessionid` and `csrftoken`.
    *   Enter these values into the app and click **Check** to authenticate.

2.  **Download Torrent Files & Metadata**
    *   Once authenticated, use the **Download Favorites** button in the app's settings.
    *   This process will contact nhentai, save the metadata for each entry into your local database, and download the corresponding `.torrent` files into the `download_me_senpai` folder at the root of the project.

3.  **Download the Doujinshi Content**
    *   This step happens **outside** the application.
    *   Using **your own torrent client**, open the `.torrent` files that were saved in the `download_me_senpai` folder.
    *   Set the final download location for these torrents to the `doujinshi` folder at the root of the project. 

4.  **Synchronize the Library**
    *   Once your content has finished downloading, navigate back to the **Settings -> Sync** page in the application.
    *   Click **Start Sync**. The application will scan the `doujinshi` folder and attempt to match the downloaded content with the metadata in the database by updating the `folder_name` for each entry.
    *   If any entries cannot be matched automatically (due to different folder names), they will appear in the **Manual Sync** section, where you can match them yourself using the provided UI.

5.  **Enjoy!**

## Roadmap

Future enhancements and features planned for the project:

### Core Features
*   [ ] **"In Progress" Filter:** Implement the "Currently Reading" filter on the browse page to show only doujinshi that are partially read.
*   [ ] **Manual Metadata Editor:** Create an interface on the doujinshi overview page to manually add, remove, or correct tags, artists, characters, etc.
*   [ ] **Expand External Provider Integrations:** Add support for syncing and downloading from other popular sources.
*   [ ] **Authentication:** Have a password set before anyone in your local network is able to access the site

### Data & Library Management
*   [ ] **Backup & Import Functionality:** Add tools to export the library database for backup and import it on a new instance.
*   [ ] **Improve Manual Sync UI:** Enhance the user interface for manually matching pending entries with folders, making the process more intuitive.

### UI/UX Enhancements
*   [ ] **Replace Browser Dialogs:** Convert all `alert()` and `prompt()` calls to custom UI modals or toasts for a more integrated experience.
*   [ ] **Add Granular Loading Indicators:** Show loading states on individual components (e.g., favorite buttons, sync buttons) during API calls.

### Performance & Stability
*   [ ] **Implement Backend Pagination:** For the main library view to handle very large collections efficiently without a slow initial load.
*   [ ] **Add Unit & Integration Tests:** For both the frontend and backend to ensure long-term stability and reliability.

## License

Distributed under the MIT License. See `LICENSE` for more information.
