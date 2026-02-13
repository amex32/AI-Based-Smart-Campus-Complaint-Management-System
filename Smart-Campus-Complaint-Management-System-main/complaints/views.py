from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import Complaint
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import logout

def login_view(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        # Step 1: Authenticate user
        user = authenticate(request, username=username, password=password)

        # Step 2: Check if user exists
        if user is not None:
            login(request, user)  # Create session

            # Step 3: Role-based redirection
            if user.is_superuser:
                return redirect('/admin/')

            elif user.groups.filter(name='Staff').exists():
                return redirect('staff_dashboard')

            else:
                return redirect('student_dashboard')
        else:
            messages.error(request, "Invalid username or password")

    return render(request, 'login.html')

@login_required
def student_dashboard(request):
    complaints = Complaint.objects.filter(student=request.user).order_by('-created_at')
    return render(request, 'student_dashboard.html', {
        'complaints': complaints
    })



@login_required
def staff_dashboard(request):
    complaints = Complaint.objects.all().order_by("-created_at")
    return render(request, 'staff_dashboard.html',{
        'complaints' : complaints
    })

from django.contrib.auth.decorators import login_required
from .models import Complaint

@login_required
def create_complaint(request):
    if request.method == "POST":
        title = request.POST.get('title')
        description = request.POST.get('description')
        department = request.POST.get('department')

        Complaint.objects.create(
            student=request.user,
            title=title,
            description=description,
            department=department
        )

        return redirect('student_dashboard')

    return render(request, 'create_complaint.html')

@login_required
def Update_status(request, complaint_id):
    if request.method=="post":
        complaint = Complaint.objects.get(id=complaint_id)
        complaint.status = request.post.get('status')
        complaint.save()

    return redirect('staff_dashboard')


def logout_view(request):
    logout(request)
    return redirect('login')