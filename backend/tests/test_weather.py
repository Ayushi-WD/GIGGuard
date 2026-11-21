import httpx

from app.models import DisruptionType as D
from app.services import weather
from app.services.weather import Observation, detect_disruptions, fetch_observation


def test_no_keys_falls_back_to_mock(monkeypatch):
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)
    monkeypatch.delenv("AQICN_API_KEY", raising=False)
    obs = fetch_observation("Mumbai")
    assert obs.source == "mock"
    assert detect_disruptions(obs) == []


def test_network_failure_falls_back(monkeypatch):
    monkeypatch.setenv("OPENWEATHER_API_KEY", "x")
    monkeypatch.setenv("AQICN_API_KEY", "x")

    def boom(*args, **kwargs):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(weather.httpx, "get", boom)
    obs = fetch_observation("Delhi")
    assert obs.source == "mock"


def test_successful_api_parsing(monkeypatch):
    monkeypatch.setenv("OPENWEATHER_API_KEY", "x")
    monkeypatch.setenv("AQICN_API_KEY", "x")

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def raise_for_status(self):
            pass

        def json(self):
            return self.payload

    def fake_get(url, **kwargs):
        if "openweathermap" in url:
            return FakeResponse({"rain": {"1h": 55.0}, "main": {"temp": 31.0}})
        return FakeResponse({"data": {"aqi": 320}})

    monkeypatch.setattr(weather.httpx, "get", fake_get)
    obs = fetch_observation("Mumbai")
    assert obs.source == "api"
    assert obs.rain_mm == 55.0
    assert obs.aqi == 320
    types = {t for t, _ in detect_disruptions(obs)}
    assert types == {D.RAIN, D.AQI}


def test_aqicn_dash_value_is_handled(monkeypatch):
    monkeypatch.setenv("AQICN_API_KEY", "x")
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"data": {"aqi": "-"}}

    monkeypatch.setattr(weather.httpx, "get", lambda *a, **k: FakeResponse())
    assert fetch_observation("Chennai").source == "mock"


def test_detect_disruptions_heat():
    obs = Observation("Delhi", rain_mm=0, temp_c=46, aqi=80, source="api")
    assert detect_disruptions(obs) == [(D.HEAT, 46)]