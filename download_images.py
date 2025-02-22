
import os
import shutil

def download_images():
    base_dir = 'images/2x/'
    if not os.path.exists('downloaded_images'):
        os.makedirs('downloaded_images')
    
    if os.path.exists(base_dir):
        for filename in os.listdir(base_dir):
            if filename.endswith(('.jpg', '.png', '.gif')):
                source = os.path.join(base_dir, filename)
                destination = os.path.join('downloaded_images', filename)
                try:
                    shutil.copy2(source, destination)
                    print(f'Copied: {filename}')
                except Exception as e:
                    print(f'Error copying {filename}: {e}')

if __name__ == '__main__':
    download_images()
