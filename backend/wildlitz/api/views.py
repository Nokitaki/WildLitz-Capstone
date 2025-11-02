# api/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import UserProgress, UserActivity, UserSession
import json

# ✅ ADD THESE IMPORTS
import logging
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncDay
from datetime import timedelta

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(username=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user (using email as username)
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Create session record
        UserSession.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user's profile"""
    try:
        user = request.user
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            }
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Progress Tracking Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_user_activity(request):
    """Log a single user activity (question attempt)"""
    try:
        data = request.data
        user = request.user
        
        # Extract activity data
        module = data.get('module')
        activity_type = data.get('activity_type')
        question_data = data.get('question_data')
        user_answer = data.get('user_answer')
        correct_answer = data.get('correct_answer')
        is_correct = data.get('is_correct', False)
        time_spent = data.get('time_spent', 0)  # seconds
        difficulty = data.get('difficulty', 'medium')
        challenge_level = data.get('challenge_level', '')
        learning_focus = data.get('learning_focus', '')
        
        # Create detailed activity record
        activity = UserActivity.objects.create(
            user=user,
            module=module,
            activity_type=activity_type,
            question_data=question_data,
            user_answer=user_answer,
            correct_answer=correct_answer,
            is_correct=is_correct,
            time_spent=time_spent,
            difficulty=difficulty,
            challenge_level=challenge_level,
            learning_focus=learning_focus
        )
        
        # Update or create progress summary
        progress, created = UserProgress.objects.get_or_create(
            user=user,
            module=module,
            difficulty=difficulty,
            defaults={
                'total_attempts': 0,
                'correct_answers': 0,
                'total_time_spent': timezone.timedelta(0),
                'accuracy_percentage': 0.0,
                'average_time_per_question': 0.0
            }
        )
        
        # Update progress
        progress.update_progress(is_correct, time_spent)
        
        return Response({
            'message': 'Activity logged successfully',
            'activity_id': activity.id,
            'current_accuracy': progress.accuracy_percentage,
            'total_attempts': progress.total_attempts
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_progress(request):
    """Get user's progress across all modules"""
    try:
        user = request.user
        module = request.GET.get('module')  # Optional filter by module
        
        progress_query = UserProgress.objects.filter(user=user)
        if module:
            progress_query = progress_query.filter(module=module)
        
        progress_data = []
        for progress in progress_query:
            progress_data.append({
                'module': progress.module,
                'difficulty': progress.difficulty,
                'total_attempts': progress.total_attempts,
                'correct_answers': progress.correct_answers,
                'accuracy_percentage': progress.accuracy_percentage,
                'total_time_spent': str(progress.total_time_spent),
                'average_time_per_question': progress.average_time_per_question,
                'last_activity': progress.last_activity,
            })
        
        return Response({
            'user_progress': progress_data
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_analytics(request):
    """Get user analytics summary"""
    try:
        user = request.user
        
        # Overall statistics
        total_activities = UserActivity.objects.filter(user=user).count()
        total_correct = UserActivity.objects.filter(user=user, is_correct=True).count()
        overall_accuracy = (total_correct / total_activities * 100) if total_activities > 0 else 0
        
        # Module breakdown
        module_stats = {}
        for module_choice in UserProgress.MODULE_CHOICES:
            module_name = module_choice[0]
            activities = UserActivity.objects.filter(user=user, module=module_name)
            correct_count = activities.filter(is_correct=True).count()
            total_count = activities.count()
            
            module_stats[module_name] = {
                'total_attempts': total_count,
                'correct_answers': correct_count,
                'accuracy': (correct_count / total_count * 100) if total_count > 0 else 0,
                'total_time': sum([a.time_spent for a in activities], 0)
            }
        
        return Response({
            'overall_stats': {
                'total_activities': total_activities,
                'total_correct': total_correct,
                'overall_accuracy': overall_accuracy,
            },
            'module_stats': module_stats,
            'user_info': {
                'email': user.email,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            }
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
      
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_progress_summary(request):
    """
    Get a summary of the logged-in user's progress.
    """
    user = request.user
    try:
        # Get all progress records for this user
        progress_records = UserProgress.objects.filter(
            user=user, 
            module='syllabification'
        )

        if not progress_records.exists():
            return Response({
                'total_attempts': 0,
                'total_correct': 0,
                'overall_accuracy': 0,
                'total_time_spent_sec': 0,
                'average_time_per_question': 0
            })

        # Aggregate stats
        total_attempts = sum(p.total_attempts for p in progress_records)
        total_correct = sum(p.correct_answers for p in progress_records)
        overall_accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0
        
        # 🔥 FIX: Convert timedelta to seconds before summing
        total_time_spent_sec = sum(p.total_time_spent.total_seconds() for p in progress_records)
        average_time_per_question = (total_time_spent_sec / total_attempts) if total_attempts > 0 else 0

        # Find favorite (most played) difficulty
        favorite_difficulty = progress_records.order_by('-total_attempts').first()
        
        return Response({
            'total_attempts': total_attempts,
            'total_correct': total_correct,
            'overall_accuracy': round(overall_accuracy, 1),
            'total_time_spent_sec': int(total_time_spent_sec),  # 🔥 Convert to int
            'average_time_per_question': round(average_time_per_question, 2),
            'favorite_difficulty': favorite_difficulty.difficulty if favorite_difficulty else 'N/A'
        })

    except Exception as e:
        # 🔥 Use print instead of logger if logger not defined
        print(f"Error in get_my_progress_summary for user {user.id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_accuracy_over_time(request):
    """
    Get the user's accuracy for the last 20 game sessions.
    Groups activities into sessions based on time proximity.
    """
    user = request.user
    try:
        from datetime import timedelta
        from django.db.models import Count, Q
        
        # Get all syllable clapping activities, ordered by time
        activities = UserActivity.objects.filter(
            user=user,
            module='syllabification',
            activity_type='syllable_clapping'
        ).order_by('-timestamp')
        
        if not activities.exists():
            return Response([])
        
        # Group activities into game sessions
        # Activities within 5 minutes of each other are considered same session
        sessions = []
        current_session = []
        last_timestamp = None
        
        for activity in activities:
            if last_timestamp is None or (last_timestamp - activity.timestamp) <= timedelta(minutes=5):
                current_session.append(activity)
            else:
                # Save previous session and start new one
                if current_session:
                    sessions.append(current_session)
                current_session = [activity]
            last_timestamp = activity.timestamp
        
        # Don't forget the last session
        if current_session:
            sessions.append(current_session)
        
        # Calculate accuracy for each session and format data
        chart_data = []
        for idx, session in enumerate(sessions[:20]):  # Last 20 sessions
            total = len(session)
            correct = sum(1 for a in session if a.is_correct)
            accuracy = (correct / total * 100) if total > 0 else 0
            
            # Use session number or timestamp
            chart_data.append({
                'date': f'Game {len(sessions) - idx}',  # "Game 1", "Game 2", etc.
                'accuracy': round(accuracy, 1),
                'attempts': total,
                'timestamp': session[0].timestamp.strftime('%Y-%m-%d %H:%M')
            })
        
        # Reverse so oldest game is on the left
        chart_data.reverse()
        
        return Response(chart_data)

    except Exception as e:
        print(f"Error in get_my_accuracy_over_time for user {user.id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_most_missed_words(request):
    """
    Get the top 5 most frequently missed words for the logged-in user.
    """
    user = request.user
    try:
        # Find words this user got wrong, group by word, and count occurrences
        missed_words = UserActivity.objects.filter(
            user=user,
            module='syllabification',
            activity_type='syllable_clapping',
            is_correct=False
        ).values(
            # We assume the word is stored in 'question_data' as a JSON field
            'question_data__word' 
        ).annotate(
            missed_count=Count('id')
        ).order_by(
            '-missed_count'
        )[:5] # Get top 5

        # Format the data
        formatted_list = [
            {
                'word': item['question_data__word'],
                'missed_count': item['missed_count']
            }
            for item in missed_words if item['question_data__word'] is not None
        ]

        return Response(formatted_list)

    except Exception as e:
        logger.error(f"Error in get_my_most_missed_words for user {user.id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)