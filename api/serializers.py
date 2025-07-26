from rest_framework import serializers

class EnrollSerializer(serializers.Serializer):
    section_id = serializers.IntegerField(min_value=1)
