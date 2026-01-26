from accounts.models import User
from construction.models.request import ConstructionRequest

user = User.objects.get(email='test@example.com')
requests = ConstructionRequest.objects.filter(client=user)
for req in requests:
    print(f'ID: {req.id}, Title: {req.title}, Status: "{req.status}" (type: {type(req.status)})')
