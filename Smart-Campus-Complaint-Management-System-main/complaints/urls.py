from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('student/', views.student_dashboard, name='student_dashboard'),
    path('staff/', views.staff_dashboard, name='staff_dashboard'),
    path('create/', views.create_complaint, name='create_complaint'),
    path('update-status/<int:complaint_id>/',views.Update_status, name='update_status'),
   path('logout/', views.logout_view, name="logout"),

]
