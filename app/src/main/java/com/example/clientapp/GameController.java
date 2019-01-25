package com.example.clientapp;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

import io.socket.client.Socket;
import io.socket.emitter.Emitter;


/**
 * A simple {@link Fragment} subclass.
 * Activities that contain this fragment must implement the
 * {@link GameController.OnFragmentInteractionListener} interface
 * to handle interaction events.
 * Use the {@link GameController#newInstance} factory method to
 * create an instance of this fragment.
 */
public class GameController extends Fragment {
    // TODO: Rename parameter arguments, choose names that match
    // the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
    private static final String LOG_TAG = "GameActivity";

    private MainActivity activity;
    private Socket mSocket;

    private float clientX;
    private float clientY;

    private int color;
    private int inactiveColor = 0x2b2046;

    private int lifeNumber = 3;
    private ImageView[] lifeStatus = new ImageView[lifeNumber];

    private View trackView;
    private ImageView trackViewImg;
    private TextView txtRankPlace;
    private Button btnFire;

    private OnFragmentInteractionListener mListener;


    public GameController() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @return A new instance of fragment GameController.
     */
    // TODO: Rename and change types and number of parameters
    public static GameController newInstance() {
        GameController fragment = new GameController();
        Bundle args = new Bundle();
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        final View rootView = inflater.inflate(R.layout.fragment_game_controller, container, false);

        activity = (MainActivity) getActivity();
        mSocket = activity.getSocket();

        clientX = 0;
        clientY = 0;

        trackView = rootView.findViewById(R.id.track_zone);
        trackViewImg = rootView.findViewById(R.id.track_zone_img);
        final TextView usernameView = rootView.findViewById(R.id.field_username);
        final ImageView disconnectBtn = rootView.findViewById(R.id.disconnect_btn);
        final TextView txtRank = rootView.findViewById(R.id.txt_rank);
        txtRankPlace = rootView.findViewById(R.id.txt_rank_place);
        lifeStatus[0] = rootView.findViewById(R.id.life_icon_1);
        lifeStatus[1] = rootView.findViewById(R.id.life_icon_2);
        lifeStatus[2] = rootView.findViewById(R.id.life_icon_3);
        btnFire = rootView.findViewById(R.id.btn_fire);

        trackView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {

                clientX = 0;
                clientY = 0;

                if (event.getAction() == MotionEvent.ACTION_MOVE) {
                    v.performClick();
                    float currclientX = event.getX();
                    float currclientY = event.getY();

                    clientX = (currclientX / trackView.getWidth()) * 2 - 1;
                    clientY = (currclientY / trackView.getHeight()) * 2 - 1;
                }
                return true;
            }
        });

        disconnectBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                activity.backHome();
            }
        });

        btnFire.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                fireRocket();
            }
        });

        new Timer().scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                JSONObject jsonObject = new JSONObject();
                try {
                    jsonObject.put("x", clientX);
                    jsonObject.put("y", clientY);
                    mSocket.emit("client_move", jsonObject);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }, 0, 100);

        // Socket call
        mSocket.on("server_lives", handleLife);
        mSocket.on("server_restart", restart);
        mSocket.on("server_rank", updateRank);

        // Change interface depending on player assignment
        color = activity.getPlayerColor();
        trackView.setBackgroundColor(color);
        trackViewImg.setColorFilter(color);
        usernameView.setText(activity.getPlayerUsername());
        usernameView.setTextColor(color);
        txtRank.setTextColor(color);
        txtRankPlace.setTextColor(color);
        disconnectBtn.setColorFilter(color);
        btnFire.setBackgroundColor(color);
        btnFire.setEnabled(true);

        lifeHandler(lifeNumber);

        return rootView;
    }

    // TODO: Rename method, update argument and hook method into UI event
    public void onButtonPressed(Uri uri) {
        if (mListener != null) {
            mListener.onFragmentInteraction();
        }
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        if (context instanceof OnFragmentInteractionListener) {
            mListener = (OnFragmentInteractionListener) context;
        } else {
            throw new RuntimeException(context.toString()
                    + " must implement OnFragmentInteractionListener");
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        mListener = null;
        activity.backHome();
    }

    public void onDestroy() {
        super.onDestroy();
        activity.backHome();
    }

    /**
     * This interface must be implemented by activities that contain this
     * fragment to allow an interaction in this fragment to be communicated
     * to the activity and potentially other fragments contained in that
     * activity.
     * <p>
     * See the Android Training lesson <a href=
     * "http://developer.android.com/training/basics/fragments/communicating.html"
     * >Communicating with Other Fragments</a> for more information.
     */
    public interface OnFragmentInteractionListener {
        // TODO: Update argument type and name
        void onFragmentInteraction();
    }

    public Emitter.Listener handleLife = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    int life = (Integer) args[0];
                    lifeHandler(life);
                }
            });
        }
    };

    public Emitter.Listener restart = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    lifeNumber = activity.getPlayerLifeNumber();
                    lifeHandler(lifeNumber);
                    trackView.setBackgroundColor(color);
                    trackViewImg.setVisibility(View.INVISIBLE);

                    btnFire.setBackgroundColor(color);
                    btnFire.setEnabled(true);
                }
            });
        }
    };


    public Emitter.Listener updateRank = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    int newRank = (Integer) args[0];
                    txtRankPlace.setText(String.valueOf(newRank));
                }
            });
        }
    };

    public void lifeHandler(int lifes) {
        for(int i = 0; i < lifeStatus.length;i++) {
            if(lifes > i){
                lifeStatus[i].setColorFilter(color);
            }else {
                lifeStatus[i].setColorFilter(inactiveColor);
                Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    //deprecated in API 26
                    v.vibrate(100);
                }
            }
        }

        if(lifes == 0){
            trackView.setBackgroundColor(inactiveColor);
            trackViewImg.setVisibility(View.VISIBLE);

            btnFire.setBackgroundColor(inactiveColor);
            btnFire.setEnabled(false);

            Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(400, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                //deprecated in API 26
                v.vibrate(400);
            }
        }
    }

    public void fireRocket() {
        mSocket.emit("client_rocket");
        btnFire.setBackgroundColor(inactiveColor);
        btnFire.setEnabled(false);

        new android.os.Handler().postDelayed(
                new Runnable() {
                    public void run() {
                        btnFire.setBackgroundColor(color);
                        btnFire.setEnabled(true);
                    }
                },
                3000);
    }
}
