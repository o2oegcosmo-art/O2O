import re

with open('/var/www/o2oeg/backend/.env', 'r') as f:
    content = f.read()

# Remove all DB_ lines (including commented ones)
content = re.sub(r'\n# DB_[A-Z_]+=.*', '', content)
content = re.sub(r'\nDB_[A-Z_]+=.*', '', content)

# Add correct DB settings at end
content += '\nDB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=o2oeg\nDB_USERNAME=o2o_user\nDB_PASSWORD=Amzabola@224466'

with open('/var/www/o2oeg/backend/.env', 'w') as f:
    f.write(content)

print('ENV Fixed Successfully!')
