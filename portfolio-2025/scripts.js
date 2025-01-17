document.addEventListener("DOMContentLoaded", () => {
    // Load header
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header');
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = `
                    <nav>
                        <a href="index.html">Dmytro Dvornichenko</a>
                        <div>
                            <a href="mailto:email@example.com">Email</a>
                            <a href="https://linkedin.com/in/username">LinkedIn</a>
                            <a href="https://twitter.com/username">Twitter</a>
                        </div>
                    </nav>`;
            }
        });
});