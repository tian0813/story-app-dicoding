import { View } from "../mvp/mvp-base";

export default class AboutView extends View {
  constructor() {
    super();
  }

  async render() {
    const myGithub = "https://github.com/tian0813";
    const myEmail = "christian123star@gmail.com";
    const myLinkedin = "https://www.linkedin.com/in/christian-andri-siahaan/";

    return `
      <section class="container about-page-section">
        <h1 class="about-title">About This Dicoding Story App Project</h1>
        
        <article class="about-section">
          <h2>Project Criteria Fulfilled</h2>
          <p>Welcome to the "About" page of my Dicoding Story App project! This application is the result of my dedication and learning in building modern web applications, specifically as part of my final assignment for Dicoding Academy.</p>
          <p>This project is designed to display and allow users to share stories through a web platform. In it, I have implemented various challenging and relevant mandatory criteria for modern web development, including:</p>
          
          <ul class="criteria-list">
            <li>
              <h3>Mandatory Criterion 1: Maintaining All Previous Submission Criteria</h3>
              <p>This project ensures all conditions met in the first submission are still well-fulfilled, including:</p>
              <ul>
                <li>Utilizing a single API as the data source: The application relies entirely on the <a href="https://story-api.dicoding.dev/docs" target="_blank" rel="noopener noreferrer">official Dicoding Story API</a> as its primary data source.</li>
                <li>Using Single-Page Application (SPA) architecture: Provides a seamless and responsive user experience with instant navigation without full page reloads, using <em>hash-based routing</em> (e.g., <code>#/</code>, <code>#/add</code>, <code>#/about</code>). The Model-View-Presenter (MVP) design pattern is consistently applied.</li>
                <li>Displaying data from API: The main page displays a list of stories fetched from the API, complete with images, descriptions, uploader's names, publication dates, and location information visualized through an interactive digital map.</li>
                <li>Having a new data addition feature: Users can add new stories via a dedicated form, including image capture with a camera and location pinpointing via the map.</li>
                <li>Implementing accessibility according to standards: A top priority with the implementation of "Skip to Content", alternative text (Alt Text) for images, form controls associated with labels, and the use of semantic HTML elements.</li>
                <li>Designing smooth page transitions: Uses the View Transition API for a pleasing visual effect when switching between views, making navigation feel more modern.</li>
              </ul>
            </li>
            <li>
              <h3>Mandatory Criterion 2: Implementing Push Notification</h3>
              <p>This application has implemented **Push Notification** using the provided API. This feature allows the application to send notifications to users even when the app is not active, enhancing user engagement.</p>
            </li>
            <li>
              <h3>Mandatory Criterion 3: Adopting PWA (Installable & Offline)</h3>
              <p>This application adopts the principles of **Progressive Web Apps (PWA)** with the following provisions:</p>
              <ul>
                <li>**Adopting Application Shell architecture**: Separates static and dynamic content for faster loading.</li>
                <li>**The application can be installed to the Homescreen**: Indicated by the appearance of an "Add to Homescreen" icon in the browser, allowing users to install the app like a native application.</li>
                <li>**The application can be accessed offline**: The entire application UI can be displayed and functions well even without an internet connection, providing a reliable experience.</li>
              </ul>
            </li>
            <li>
              <h3>Mandatory Criterion 4: Utilizing IndexedDB for Data Storage</h3>
              <p>To enhance the offline experience, this application utilizes the **IndexedDB API**. The application provides functionality to:</p>
              <ul>
                <li>**Store** data from the API.</li>
                <li>**Display** stored data, even when offline.</li>
                <li>**Delete** data no longer needed from IndexedDB.</li>
              </ul>
              <p>This ensures important data can be accessed and managed locally.</p>
            </li>
            <li>
              <h3>Mandatory Criterion 5: Public Distribution (Deployment)</h3>
              <p>This application has been publicly distributed and can be accessed via the internet. Deployment was performed using a recommended platform, and the deployment URL is included in the submission document.</p>
            </li>
          </ul>
        </article>

        <br>

        <article class="about-section my-info-section">
          <h2>Developer Information</h2>
          <p>This project was developed as part of my learning and assignment for Dicoding.</p>
          <ul class="contact-list">
            <li><strong>Email:</strong> <a href="mailto:${myEmail}">${myEmail}</a></li>
            <li><strong>GitHub:</strong> <a href="${myGithub}" target="_blank" rel="noopener noreferrer">${myGithub.replace(
      "https://github.com/",
      ""
    )}</a></li>
            <li><strong>LinkedIn:</strong> <a href="${myLinkedin}" target="_blank" rel="noopener noreferrer">${myLinkedin.replace(
      "https://www.linkedin.com/in/",
      ""
    )}</a></li>
          </ul>
        </article>
      </section>
    `;
  }

  async afterRender() {}
}
