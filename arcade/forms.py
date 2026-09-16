from django import forms

from .models import Profile


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ["profile_picture"]
        labels = {"profile_picture": "Profile picture"}
        widgets = {
            "profile_picture": forms.FileInput(
                attrs={"accept": "image/png,image/jpeg,image/webp"}
            )
        }
