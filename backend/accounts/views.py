from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (RegisterStudentSerializer, RegisterAdminSerializer,
                           LoginSerializer, UserSerializer)

class RegisterStudentView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = RegisterStudentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(UserSerializer(user).data, status=201)

class RegisterAdminView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = RegisterAdminSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response(UserSerializer(user).data, status=201)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(s.validated_data)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)